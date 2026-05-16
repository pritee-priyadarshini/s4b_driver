import React, { useRef, useState } from "react";

import {
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View,
    TextInput,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps, } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";
import { AppText } from "../components/AppText";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";

import { palette } from "../theme/colors";
import { spacing } from "../theme/spacing";

type Props = NativeStackScreenProps<RootStackParamList, "ChangePassword">;

export function ChangePasswordScreen({
    navigation,
}: Props) {
    const [email, setEmail] = useState("driver@email.com");
    const [otp, setOtp] = useState(["", "", "", "", "", "",]);
    const inputs = useRef<(TextInput | null)[]>([]);

    const [newPassword, setNewPassword,] = useState("");
    const [confirmPassword, setConfirmPassword,] = useState("");
    const [loading, setLoading,] = useState(false);
    const [showNew, setShowNew,] = useState(false);
    const [showConfirm, setShowConfirm,] = useState(false);

    const validate = () => {
        const enteredOtp = otp.join("");
        if (enteredOtp.length !== 6) {
            Alert.alert("Invalid OTP", "Please enter valid 6 digit OTP.");
            return false;
        }

        if (newPassword.length < 8) {
            Alert.alert("Weak Password", "Password should be minimum 8 characters.");
            return false;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Password Mismatch", "New Passwords do not match.");
            return false;
        }
        return true;
    };

    const handleOtpChange = (text: string, index: number) => {
        const next = [...otp];
        next[index] = text.replace(/[^0-9]/g, "");
        setOtp(next);
        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleBackspace = (text: string, index: number) => {
        if (!text && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleSendOtp = async () => {
        if (!email.trim()) {
            Alert.alert("Email Required", "Please enter your email.");
            return;
        }
        Alert.alert("OTP Sent", "Mock OTP sent successfully.");
    };

    const handleSubmit = async () => {
        if (!validate()) {
            return;
        }

        try {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            Alert.alert("Success", "Password updated successfully.",
                [
                    {
                        text: "OK",
                        onPress: () =>
                            navigation.goBack(),
                    },
                ]
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >

            <Screen scrollable backgroundColor={palette.creme}>
                <ImageBackground
                    source={require("../../assets/placeholder/feed-bg.png")}
                    style={styles.headerBg}
                >
                    <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={palette.white}
                        />
                    </Pressable>

                    <AppText variant="h5" style={styles.white}  >
                        Change Password
                    </AppText>
                </ImageBackground>

                <View style={styles.content}>
                    <View style={styles.infoCard}>
                        <View style={styles.infoIcon}>
                            <Ionicons
                                name="shield-checkmark"
                                size={24}
                                color={palette.primary}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <AppText variant="bodyBold">
                                Secure Your Account
                            </AppText>

                            <AppText variant="bodySmall" style={styles.infoText}  >
                                Your password should contain at least 8 characters
                            </AppText>
                        </View>
                    </View>

                    {/* EMAIL */}
                    <InputField
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => {
                                    inputs.current[index] = ref;
                                }}
                                style={styles.otpInput}
                                keyboardType="number-pad"
                                maxLength={1}
                                value={digit}
                                onChangeText={(text) => handleOtpChange(text, index)}
                                onKeyPress={({ nativeEvent }) => {
                                    if (
                                        nativeEvent.key === "Backspace"
                                    ) {
                                        handleBackspace(
                                            digit,
                                            index
                                        );
                                    }
                                }}
                            />
                        ))}
                    </View>

                    <Button label="Resend OTP" onPress={handleSendOtp} />


                    <View style={styles.inputWrapper}>
                        <InputField
                            label="New Password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNew}
                        />

                        <Pressable
                            style={styles.eyeBtn}
                            onPress={() =>
                                setShowNew(!showNew)
                            }
                        >
                            <Ionicons
                                name={showNew ? "eye-off" : "eye"}
                                size={18}
                                color={palette.stone}
                            />
                        </Pressable>
                    </View>

                    <View style={styles.inputWrapper}>
                        <InputField
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={
                                !showConfirm
                            }
                        />

                        <Pressable
                            style={styles.eyeBtn}
                            onPress={() =>
                                setShowConfirm(
                                    !showConfirm
                                )
                            }
                        >
                            <Ionicons
                                name={showConfirm ? "eye-off" : "eye"}
                                size={18}
                                color={palette.stone}
                            />
                        </Pressable>
                    </View>

                    <View style={styles.rulesCard}>

                        <AppText variant="bodyBold" style={{ marginBottom: spacing.sm, }} >
                            Password Rules
                        </AppText>

                        {[
                            "Minimum 8 characters",
                            "Use uppercase & lowercase letters",
                            "Include at least one number",
                            "Use one special character",
                        ].map((rule) => (
                            <View key={rule} style={styles.ruleRow} >
                                <Ionicons
                                    name="checkmark-circle"
                                    size={16}
                                    color={palette.success}
                                />

                                <AppText variant="bodySmall"  >
                                    {rule}
                                </AppText>
                            </View>
                        ))}

                    </View>

                    <Button
                        label={loading ? "Updating..." : "Update Password"}
                        onPress={handleSubmit}
                        style={styles.submitBtn}
                    />
                </View>
            </Screen>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({

    headerBg: {
        height: 160,
        justifyContent: "center",
        alignItems: "center",
    },

    backButton: {
        position: "absolute",
        top: 20,
        left: 15,
    },

    white: {
        color: palette.white,
    },

    otpContainer: {
        flexDirection: "row",
        gap: spacing.sm,
    },

    otpInput: {
        flex: 1,
        height: 52,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 14,
        backgroundColor: palette.white,

        textAlign: "center",
        fontSize: 18,
        fontFamily: "Saveful-Bold",
    },

    content: {
        padding: spacing.lg,
        gap: spacing.lg,
    },

    infoCard: {
        backgroundColor: palette.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.border,
        padding: spacing.md,

        flexDirection: "row",
        gap: spacing.md,
        alignItems: "center",
    },

    infoIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: palette.radish,

        justifyContent: "center",
        alignItems: "center",
    },

    infoText: {
        marginTop: 4,
        color: palette.stone,
    },

    inputWrapper: {
        position: "relative",
    },

    eyeBtn: {
        position: "absolute",
        right: 14,
        top: 42,
    },

    rulesCard: {
        backgroundColor: palette.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.border,
        padding: spacing.md,
        gap: spacing.sm,
    },

    ruleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },

    submitBtn: {
        backgroundColor: palette.primary,
        marginTop: spacing.sm,
    },

});