import constants from "../constants";
import uuidv1 from "uuid";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-community/async-storage";

getInitialState = () => {
  return {
    guitars: [],
    notifications: null,
    selectedForEditing: null
  };
};

const reducer = (state = getInitialState(), action) => {
  switch (action.type) {
    //Adding all guitars as they are collected from async storage
    case constants.initializeGuitars:
      return {
        ...state,
        guitars: action.payload === null ? [] : action.payload
      };
    //This is the guitar selected for editing
    case constants.selectedGuitar:
      return {
        ...state,
        selectedForEditing: action.payload
      };
    //Pushing newly created guitar to the guitars list
    case constants.addGuitar:
      let newGuitarArr = [action.payload];
      let concatenatedArray = newGuitarArr.concat(state.guitars);
      //Persisting new notifications state in AsyncStorage
      AsyncStorage.setItem(
        constants.persistedGuitars,
        JSON.stringify(concatenatedArray)
      );
      return {
        ...state,
        guitars: concatenatedArray
      };
    //Updating value(s) of an existing guitar
    case constants.editGuitar:
      let AnotherNewGuitarArr = [action.payload];
      let updatedArr = state.guitars;
      for (let i in updatedArr) {
        if (updatedArr[i].key === action.payload.key) {
          updatedArr.splice(i, 1);
          break;
        }
      }
      let AnotherConcatenatedArray = AnotherNewGuitarArr.concat(updatedArr);
      return {
        ...state,
        guitars: AnotherConcatenatedArray
      };
    //Boolean indicating whether or not to inform the user to get new strings
    case constants.showNotifications:
      //Persisting new notifications state in AsyncStorage
      AsyncStorage.setItem(
        constants.persistedNotifications,
        String(action.payload)
      );
      return {
        ...state,
        notifications: action.payload
      };
    default:
      return state;
  }
};

export default reducer;
