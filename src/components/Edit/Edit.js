import React, { Component } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableHighlight,
  Switch,
  Image,
  NativeModules,
  Platform,
  BackHandler
} from "react-native";
import styles from "./styles";
import LinearGradient from "react-native-linear-gradient";
import InstrumentType from "../InstrumentType";
import InstrumentUse from "../InstrumentUse";
import electricGuitarImg from "../../images/electric_guitar.png";
import bassImg from "../../images/bass_guitar.png";
import acousticImg from "../../images/acoustic_guitar.png";
import { connect } from "react-redux";
import { editGuitar, showDatePicker } from "../../actions";
import DatePicker from "react-native-datepicker";
import Delete from "../Delete";
import colors from "../../colors";
import constants from "../../constants";
import { HeaderBackButton } from "react-navigation";
import Dialog from "react-native-dialog";
import Toast from "react-native-easy-toast";
import ImagePicker from "react-native-image-picker";
import NotifService from "../../NotifService";
import * as Animatable from "react-native-animatable";

function getGuitar(props) {
  return props.guitars.find(x => x.key === props.selectedForEditing);
}

const options = {
  customButtons: [{ name: "delete", title: "Remove photo..." }],
  storageOptions: {
    skipBackup: true,
    path: "images"
  }
};

//name cannot be simple whitespace
const regex = "[a-z|A-Z|0-9]";

//need to know the locale for date formatting
const locale =
  Platform.OS === "ios"
    ? NativeModules.SettingsManager.settings.AppleLocale
    : NativeModules.I18nManager.localeIdentifier;

class Edit extends Component {
  //need the navigation toolbar for ios only
  static navigationOptions =
    Platform.OS === "ios"
      ? ({ navigation }) => {
          const { params = {} } = navigation.state;
          return {
            headerRight: <Delete navigation={navigation} />,
            headerLeft: (
              <HeaderBackButton
                tintColor={colors.primary}
                onPress={() => params.handleBack()}
              />
            )
          };
        }
      : null;

  constructor(props) {
    super(props);
    const originalGuitar = getGuitar(this.props);
    this.state = {
      originalGuitar,
      editedGuitar: {
        key: originalGuitar.key,
        name: originalGuitar.name,
        type: originalGuitar.type,
        use: originalGuitar.use,
        timestamp: originalGuitar.timestamp,
        coated: originalGuitar.coated,
        photo: originalGuitar.photo
      },
      editingName: false,
      warningPopup: false,
      nameValid: true
    };
    this.notif = new NotifService();
  }

  handleNameChange = event => {
    this.setState({
      ...this.state,
      editedGuitar: { ...this.state.editedGuitar, name: event }
    });
  };

  handleTypeChange = newType => {
    this.setState({
      ...this.state,
      editedGuitar: { ...this.state.editedGuitar, type: newType }
    });
  };

  handleUseChange = newUse => {
    this.setState({
      ...this.state,
      editedGuitar: { ...this.state.editedGuitar, use: newUse }
    });
  };

  onSwitchChanged = () => {
    this.setState({
      ...this.state,
      editedGuitar: {
        ...this.state.editedGuitar,
        coated: !this.state.editedGuitar.coated
      }
    });
  };

  handleSubmit = () => {
    //animate the update button before doing anything else
    this.refs["update"].rubberBand(500).then(endState => {
      //cannot submit an empty name
      if (this.state.editedGuitar.name.match(regex)) {
        //just go back if there are no changes
        if (
          this.state.originalGuitar.name === this.state.editedGuitar.name &&
          this.state.originalGuitar.type === this.state.editedGuitar.type &&
          this.state.originalGuitar.use === this.state.editedGuitar.use &&
          this.state.originalGuitar.timestamp ===
            this.state.editedGuitar.timestamp &&
          this.state.originalGuitar.coated === this.state.editedGuitar.coated &&
          this.state.originalGuitar.photo === this.state.editedGuitar.photo
        ) {
          this.props.navigation.navigate("Home");
          //save changes
        } else {
          this.props.editGuitar(this.state.editedGuitar);
          //determine if reminder needs to be scheduled
          if (
            this.state.originalGuitar.timestamp !==
              this.state.editedGuitar.timestamp &&
            this.props.notifications
          ) {
            this.notif.cancelNotif(this.state.originalGuitar.key);
            this.notif.scheduleNotif(this.state.editedGuitar);
          }
          this.props.navigation.navigate("Home");
        }
      } else {
        this.setState({ ...this.state, nameValid: false });
        this.refs.toast.show("Name cannot be empty");
      }
    });
  };

  //getting selected restring date accounting for locale adjusted date format
  getFormattedDate = () => {
    const { timestamp } = this.state.editedGuitar;
    if (timestamp !== null) {
      const date = new Date(timestamp);
      const day = date.getDate();
      let month = date.getMonth();
      let year = date.getYear();
      return locale === "en_US"
        ? `${++month} ${day} ${year - 100}`
        : `${day} ${++month} ${year - 100}`;
    } else {
      return null;
    }
  };

  //getting current date accounting for locale adjusted date format
  getCurrentDate = () => {
    let today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear() - 2000;
    return locale === "en_US"
      ? `${month}-${day}-${year}`
      : `${day}-${month}-${year}`;
  };

  getDateFormat = () => {
    return locale === "en_US" ? "MM-DD-YYYY" : "DD-MM-YYYY";
  };

  instrumentImage = () => {
    let { type, photo } = this.state.editedGuitar;
    //No photo exists. Use a  default image
    if (photo === null) {
      switch (type) {
        case constants.electric:
          return electricGuitarImg;
        case constants.bass:
          return bassImg;
        case constants.acoustic:
          return acousticImg;
      }
    }
    //Return the photo
    return { uri: photo };
  };

  //show as plain text when not currently editing otherwise it should be a textinput
  name = editing => {
    return editing ? (
      <TextInput
        style={nameStyle}
        value={this.state.editedGuitar.name}
        onChangeText={this.handleNameChange}
        maxLength={15}
        autoFocus={true}
        onBlur={() => {
          if (this.state.editedGuitar.name.match(regex)) {
            this.setState({
              ...this.state,
              editingName: false,
              nameValid: true
            });
          } else {
            this.setState({ ...this.state, nameValid: false });
            this.refs.toast.show("Name cannot be empty");
          }
        }}
        selectionColor={colors.primary}
      />
    ) : (
      <Text
        style={styles.nameText}
        onPress={() => {
          this.setState({ ...this.state, editingName: true });
        }}
      >
        {this.state.editedGuitar.name}
      </Text>
    );
  };

  //options menu isn't built into navigation toolbae on android
  options = () => {
    return Platform.OS === "android" ? (
      <Delete navigation={this.props.navigation} />
    ) : null;
  };

  handleBackPressed = () => {
    //check for unsaved changes
    if (
      this.state.editedGuitar.name !== this.state.originalGuitar.name ||
      this.state.editedGuitar.type !== this.state.originalGuitar.type ||
      this.state.editedGuitar.use !== this.state.originalGuitar.use ||
      this.state.editedGuitar.timestamp !==
        this.state.originalGuitar.timestamp ||
      this.state.editedGuitar.coated !== this.state.originalGuitar.coated ||
      this.state.editedGuitar.photo !== this.state.originalGuitar.photo
    ) {
      this.setState({ ...this.state, warningPopup: true });
    } else {
      this.props.navigation.navigate("Home");
    }
    return true;
  };

  componentDidUpdate() {
    //if user selected restring button in list item then automatically show date picker
    if (this.props.changeAge) {
      this.datePicker.onPressDate();
      this.props.showDatePicker(false);
    }
  }

  componentDidMount() {
    this.props.navigation.setParams({
      handleBack: () => this.handleBackPressed()
    });
    BackHandler.addEventListener("hardwareBackPress", this.handleBackPressed);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      "hardwareBackPress",
      this.handleBackPressed
    );
  }

  render() {
    //invalid name needs a red background
    nameStyle = this.state.nameValid
      ? styles.nameInput
      : styles.nameInvalidInput;

    return (
      <View style={styles.parent}>
        <View style={styles.nameInputWrapper}>
          {this.name(this.state.editingName)}
        </View>
        <View style={styles.optionsWrapper}>{this.options()}</View>
        <TouchableHighlight
          style={styles.profileImg}
          onPress={() => {
            const optionToRemove =
              this.state.editedGuitar.photo === null ? null : options;
            ImagePicker.showImagePicker(optionToRemove, response => {
              if (response.customButton) {
                this.setState({
                  ...this.state,
                  editedGuitar: { ...this.state.editedGuitar, photo: null }
                });
              } else if (!response.didCancel) {
                this.setState({
                  ...this.state,
                  editedGuitar: {
                    ...this.state.editedGuitar,
                    photo: response.uri
                  }
                });
              }
            });
          }}
          underlayColor={colors.evenLessWhite}
        >
          <Image
            style={styles.image}
            source={this.instrumentImage()}
            resizeMode="cover"
          />
        </TouchableHighlight>
        <View style={styles.questionRow}>
          <Text style={styles.text}>What type of guitar is this?</Text>
        </View>
        <InstrumentType
          type={this.state.editedGuitar.type}
          handleTypeChange={this.handleTypeChange}
          validated={true}
        />
        <View style={styles.questionRow}>
          <Text style={styles.text}>How often do you play this guitar?</Text>
        </View>
        <InstrumentUse
          use={this.state.editedGuitar.use}
          handleUseChange={this.handleUseChange}
          validated={true}
        />
        <View style={styles.lastChanged}>
          <Text style={styles.text}>Strings last changed</Text>
          <DatePicker
            ref={picker => {
              this.datePicker = picker;
            }}
            style={styles.datePickerBtn}
            date={this.getFormattedDate()}
            mode="date"
            format={this.getDateFormat()}
            minDate="01-01-14"
            maxDate={this.getCurrentDate()}
            confirmBtnText="Confirm"
            cancelBtnText="Cancel"
            onDateChange={date => {
              date = date.split("-");
              let timestamp = null;
              locale === "en_US"
                ? (timestamp = date[0] + "/" + date[1] + "/" + date[2])
                : (timestamp = date[1] + "/" + date[0] + "/" + date[2]);
              timestamp = new Date(timestamp).getTime();
              this.setState({
                ...this.state,
                editedGuitar: { ...this.state.editedGuitar, timestamp }
              });
            }}
            customStyles={{
              btnTextConfirm: {
                color: colors.primary
              }
              // dateText: {
              //   color: colors.notQuiteWhite
              // }
            }}
          />
        </View>
        <View style={styles.coated}>
          <Text style={styles.text}>This guitar has coated strings</Text>
          <Switch
            value={this.state.editedGuitar.coated}
            onValueChange={() => this.onSwitchChanged()}
          />
        </View>
        <View style={styles.submitWrapper}>
          <Animatable.View ref="update" style={styles.updateAnimationWrapper}>
            <TouchableHighlight
              style={styles.submit}
              onPress={() => {
                this.handleSubmit();
              }}
              underlayColor={colors.evenLessWhite}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary, colors.dark]}
                style={styles.gradient}
              >
                <Text style={styles.btnText}>Update</Text>
              </LinearGradient>
            </TouchableHighlight>
          </Animatable.View>
        </View>
        <View>
          <Dialog.Container visible={this.state.warningPopup}>
            <Dialog.Title>Warning</Dialog.Title>
            <Dialog.Description>
              You have unsaved changes. Are you sure you want to leave?
            </Dialog.Description>
            <Dialog.Button
              label="Leave"
              onPress={() => {
                this.setState({ ...this.state, warningPopup: false });
                this.props.navigation.navigate("Home");
              }}
              color={colors.primary}
            />
            <Dialog.Button
              label="Stay Here"
              onPress={() => {
                this.setState({ ...this.state, warningPopup: false });
              }}
              color={colors.primary}
            />
          </Dialog.Container>
        </View>
        <Toast ref="toast" />
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    guitars: state.guitars,
    selectedForEditing: state.selectedForEditing,
    changeAge: state.changeAge,
    notifications: state.notifications
  };
};

const mapDispatchToProps = dispatch => {
  return {
    editGuitar: guitar => {
      dispatch(editGuitar(guitar));
    },
    showDatePicker: val => {
      dispatch(showDatePicker(val));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Edit);
