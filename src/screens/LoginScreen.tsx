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
} from "react-native";

import { credentials, drivers } from "../data/mock";
import { Driver } from "../types/domain";

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
  const { login } = useAuth();

  const [email, setEmail] = useState("driver.raju@seva.org");
  const [password, setPassword] = useState("seva123");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    try {
      setLoading(true);
      setError("");

      const match = credentials.find(
        (credential) =>
          credential.email.toLowerCase() ===
          email.trim().toLowerCase() &&
          credential.password === password
      );

      const driver = drivers.find(
        (item) => item.id === match?.driverId
      );

      if (!driver) {
        setError("Invalid driver email or password.");
        return;
      }

      await login(driver, "mock-access-token");
    } catch (error) {
      console.log( "LOGIN SCREEN ERROR", error );
      setError( "Something went wrong.");
    } finally {
      setLoading(false);
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
                  disabled={loading}
                >
                  <AppText
                    variant="label"
                    style={styles.buttonText}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </AppText>
                </TouchableOpacity>

                {/* MOCK CREDENTIALS */}
                <View style={styles.demoBox}>
                  <AppText
                    variant="caption"
                    style={styles.demoLabel}
                  >
                    Mock Credentials
                  </AppText>

                  <AppText
                    variant="bodySmall"
                    style={styles.demoText}
                  >
                    driver.raju@seva.org / seva123
                  </AppText>
                </View>
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

  demoBox: {
    marginTop: hp(1),
    padding: hp(1.6),
    borderRadius: normalize(12),
    backgroundColor: colors.greenSoft,
  },

  demoLabel: {
    color: colors.brandDark,
    marginBottom: hp(0.5),
  },

  demoText: {
    color: colors.text,
  },
});