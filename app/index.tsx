import React from "react";
import { Redirect } from "expo-router";
import { useFonts } from "expo-font";
import Loader from "@/components/Loader";

export default function index() {
  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  if (!fontsLoaded) {
    return <Loader />;
  }
  return <Redirect href="/(auth)/login" />;
}
