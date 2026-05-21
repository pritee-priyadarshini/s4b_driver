import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Keyboard,
} from "react-native";

import { Screen } from "../components/Screen";
import { AppText } from "../components/AppText";
import { InputField } from "../components/InputField";

import { colors } from "../components/ui";
import { useAuth } from "../store/AuthContext";

const { width, height } = Dimensions.get("window");

const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

const normalize = (size: number) => {
  const scale = width / 375;
  return Math.round(size * scale);
};

export function LoginScreen() {
  const { login, authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    try {
      setError("");

      if (!email || !password) {
        setError("Please enter email and password");
        return;
      }

      if (!email.includes("@")) {
        setError("Enter a valid email");
        return;
      }

      Keyboard.dismiss();

      await login(email.trim(), password);

    } catch (err: any) {
      if (err?.response?.status === 401) {
        setError("Invalid email or password");
      } else if (err?.message === "This account is not a driver") {
        setError("This account is not registered as a driver");
      } else {
        setError("Something went wrong. Try again.");
      }

    }
  }

  return (
    <ImageBackground
      source={require("../../assets/intro/splash.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <Screen scrollable={false} backgroundColor="transparent">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.container}>

              {/* LOGO */}
              <View style={styles.top}>
                <Image
                  source={require("../../assets/intro/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* FORM */}
              <View style={styles.form}>
                <AppText
                  variant="subheading"
                  style={styles.title}
                >
                  Welcome Back
                </AppText>

                <InputField
                  label="Email Address *"
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError("");
                  }}
                />

                <InputField
                  label="Password *"
                  value={password}
                  secureTextEntry
                  isPassword
                  onChangeText={(text) => {
                    setPassword(text);
                    setError("");
                  }}
                />

                <TouchableOpacity>
                  <AppText variant="caption">
                    Forgot Password?
                  </AppText>
                </TouchableOpacity>

                {error ? (
                  <AppText style={styles.error}>
                    {error}
                  </AppText>
                ) : null}

                <TouchableOpacity
                  style={styles.button}
                  onPress={submit}
                  disabled={authLoading || !email || !password}
                >
                  <AppText
                    variant="label"
                    style={styles.buttonText}
                  >
                    {authLoading ? "Signing In..." : "Sign In"}
                  </AppText>
                </TouchableOpacity>

              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    padding: wp(6),
  },

  top: {
    alignItems: "center",
    marginBottom: hp(8),
  },

  logo: {
    width: wp(50),
    height: hp(10),
  },

  form: {
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.surface,
    borderRadius: normalize(20),
    padding: wp(6),
    gap: hp(2),
    marginBottom: hp(12),
  },

  title: {
    textAlign: "center",
    fontSize: normalize(20),
  },

  button: {
    backgroundColor: colors.brand,
    padding: hp(1.8),
    borderRadius: normalize(14),
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: normalize(16),
  },

  error: {
    color: colors.red,
    textAlign: "center",
    fontSize: normalize(12),
  },

});