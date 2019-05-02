import constants from "../constants";

export function initializeGuitars(guitars) {
  return {
    type: constants.initializeGuitars,
    payload: guitars
  };
}

export function selectedGuitar(key) {
  return {
    type: constants.selectedGuitar,
    payload: key
  };
}

export function addGuitar(guitar) {
  return {
    type: constants.addGuitar,
    payload: guitar
  };
}

export function editGuitar(guitar) {
  return {
    type: constants.editGuitar,
    payload: guitar
  };
}

export function showNotifications(show) {
  return {
    type: constants.showNotifications,
    payload: show
  };
}
