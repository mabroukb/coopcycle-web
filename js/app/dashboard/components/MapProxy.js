import _ from 'lodash'
import L from 'leaflet'
import React from 'react'
import { render } from 'react-dom'
import MapHelper from '../../MapHelper'
import LeafletPopupContent from './LeafletPopupContent'
import CourierPopupContent from './CourierPopupContent'

const tagsColor = tags => {
  const tag = _.first(tags)

  return tag.color
}

const taskColor = task => {

  if (task.group && task.group.tags.length > 0) {
    return tagsColor(task.group.tags)
  }

  if (task.tags.length > 0) {
    const tag = _.first(task.tags)
    return tag.color
  }

  return '#777'
}

const taskIcon = task => {

  switch (task.status) {
  case 'TODO':
    if (task.type === 'PICKUP') {
      return 'cube'
    }
    if (task.type === 'DROPOFF') {
      return 'arrow-down'
    }
    break
  case 'DONE':
    return 'check'
  case 'FAILED':
    return 'remove'
  case 'CANCELLED':
    return 'ban'
  }

  return 'question'
}

const polylineOptions = {
  color: '#3498DB',
  opacity: 0.7
}

const createIcon = username => {
  const iconUrl = window.Routing.generate('user_avatar', { username })

  return L.icon({
    iconUrl: iconUrl,
    iconSize:    [20, 20], // size of the icon
    iconAnchor:  [10, 10], // point of the icon which will correspond to marker's location
    popupAnchor: [-2, -72], // point from which the popup should open relative to the iconAnchor,
  })
}

export default class MapProxy {

  constructor(map) {
    this.map = map
    this.polylineLayerGroups = new Map()

    this.taskMarkers = new Map()
    this.taskPopups = new Map()

    this.courierMarkers = new Map()
    this.courierLayerGroup = new L.LayerGroup()
    this.courierLayerGroup.addTo(this.map)
  }

  addTask(task, markerColor) {
    let marker = this.taskMarkers.get(task['id'])

    const color = markerColor || taskColor(task)
    const iconName = taskIcon(task)
    const coords = [task.address.geo.latitude, task.address.geo.longitude]

    let popupComponent = this.taskPopups.get(task['id'])

    if (!marker) {

      marker = MapHelper.createMarker(coords, iconName, 'marker', color)

      const el = document.createElement('div')

      popupComponent = React.createRef()

      render(<LeafletPopupContent
        task={ task }
        ref={ popupComponent }
        onEditClick={ () => {
          $('#task-edit-modal')
            .load(
              window.Routing.generate('admin_task', { id: task.id }),
              () => $('#task-edit-modal').modal({ show: true })
            )
        }} />, el)

      const popup = L.popup()
        .setContent(el)

      marker.bindPopup(popup)

      this.taskMarkers.set(task['id'], marker)
      this.taskPopups.set(task['id'], popupComponent)

    } else {

      let icon = MapHelper.createMarkerIcon(iconName, 'marker', color)
      marker.setIcon(icon)

      popupComponent.current.updateTask(task)

    }

    marker.addTo(this.map)
  }

  hideTask(task) {
    const marker = this.taskMarkers.get(task['id'])
    if (marker) {
      this.map.removeLayer(marker)
    }
  }

  removeTask(task) {
    this.taskMarkers.delete(task['id'])
  }

  getPolylineLayerGroup(username) {
    let layerGroup = this.polylineLayerGroups.get(username)

    if (!layerGroup) {
      layerGroup = L.layerGroup()
      this.polylineLayerGroups.set(username, layerGroup)
    }

    return layerGroup
  }

  setPolyline(username, polyline) {
    const layer = L.polyline(MapHelper.decodePolyline(polyline), polylineOptions)
    const layerGroup = this.getPolylineLayerGroup(username)

    layerGroup.clearLayers()
    layerGroup.addLayer(layer)
  }

  showPolyline(username) {
    this.getPolylineLayerGroup(username).addTo(this.map)
  }

  hidePolyline(username) {
    this.getPolylineLayerGroup(username).removeFrom(this.map)
  }

  setOnline(username) {
    if (!this.courierMarkers.has(username)) {
      return
    }
    const marker = this.courierMarkers.get(username)
    marker.setIcon(createIcon(username))
    marker.setOpacity(1)
  }

  setOffline(username) {
    if (!this.courierMarkers.has(username)) {
      return
    }
    const marker = this.courierMarkers.get(username)
    marker.setIcon(createIcon(username))
    marker.setOpacity(0.5)
  }

  setGeolocation(username, position, lastSeen) {
    let marker = this.courierMarkers.get(username)

    const popupContent = document.createElement('div')
    render(<CourierPopupContent
      username={ username }
      lastSeen={ lastSeen } />, popupContent)

    if (!marker) {
      marker = L.marker(position, { icon: createIcon(username) })
      marker.setOpacity(1)
      marker.bindPopup(popupContent, {
        offset: [3, 70],
        minWidth: 150,
      })
      this.courierLayerGroup.addLayer(marker)
      this.courierMarkers.set(username, marker)
    } else {
      marker.setLatLng(position).update()
      marker.setPopupContent(popupContent)
    }
  }
}
