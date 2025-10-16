import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface HamburgerMenuProps {
  currentScreen?: string;
}

export default function HamburgerMenu({
  currentScreen = "",
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));

  const menuItems = [
    {
      id: "calendar",
      title: "스케줄 관리",
      description: "일정을 확인하고 관리하세요",
      icon: "calendar-outline",
      color: "#3b82f6",
      route: "/schedule",
    },
    {
      id: "workers",
      title: "근로자 관리",
      description: "근로자 정보를 관리하세요",
      icon: "people-outline",
      color: "#10b981",
      route: "/workers",
    },
    {
      id: "payments",
      title: "급여 관리",
      description: "급여 계산 및 지급을 관리하세요",
      icon: "card-outline",
      color: "#f59e0b",
      route: "/payroll",
    },
    {
      id: "reports",
      title: "보고서",
      description: "월별 보고서를 확인하세요",
      icon: "bar-chart-outline",
      color: "#8b5cf6",
      route: "/reports",
    },
  ];

  const toggleMenu = () => {
    if (isOpen) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    }
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: Platform.OS !== "web",
    }).start();
    setIsOpen(false);
  };

  return (
    <>
      {/* 햄버거 버튼 */}
      <Pressable style={styles.hamburgerButton} onPress={toggleMenu}>
        <View
          style={[styles.hamburgerLine, isOpen && styles.hamburgerLineOpen]}
        />
        <View
          style={[styles.hamburgerLine, isOpen && styles.hamburgerLineOpen]}
        />
        <View
          style={[styles.hamburgerLine, isOpen && styles.hamburgerLineOpen]}
        />
      </Pressable>

      {/* 메뉴 오버레이 */}
      {isOpen && (
        <Modal
          visible={isOpen}
          transparent={true}
          animationType="none"
          onRequestClose={closeMenu}
        >
          <Pressable style={styles.overlay} onPress={closeMenu}>
            <Animated.View
              style={[
                styles.menuContainer,
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                {/* 메뉴 헤더 */}
                <View style={styles.menuHeader}>
                  <Pressable
                    onPress={() => {
                      closeMenu();
                      router.push("/main");
                    }}
                    style={styles.titleButton}
                  >
                    <View style={styles.titleContainer}>
                      <Ionicons name="home" size={20} color="#1e40af" />
                      <Text style={styles.menuTitle}>리밋 플래너</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={closeMenu} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </Pressable>
                </View>

                {/* 메뉴 아이템들 */}
                <ScrollView style={styles.menuContent}>
                  {menuItems.map((item) => (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.menuItem,
                        currentScreen === item.id && styles.menuItemActive,
                      ]}
                      onPress={() => {
                        closeMenu();
                        router.push(item.route as any);
                      }}
                    >
                      <View
                        style={[
                          styles.menuIcon,
                          { backgroundColor: item.color },
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={24}
                          color="white"
                        />
                      </View>
                      <View style={styles.menuItemContent}>
                        <Text
                          style={[
                            styles.menuItemTitle,
                            currentScreen === item.id &&
                              styles.menuItemTitleActive,
                          ]}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.menuItemDescription}>
                          {item.description}
                        </Text>
                      </View>
                      {currentScreen === item.id && (
                        <Ionicons name="checkmark" size={20} color="#1e40af" />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>

                {/* 메뉴 푸터 */}
                <View style={styles.menuFooter}>
                  <Text style={styles.menuFooterText}>버전 1.0.0</Text>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerButton: {
    width: 30,
    height: 30,
    justifyContent: "space-between",
    paddingVertical: 4,
    marginLeft: Theme.spacing.lg,
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: Theme.colors.text.primary,
    borderRadius: 1,
  },
  hamburgerLineOpen: {
    backgroundColor: Theme.colors.text.secondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    flexDirection: "row",
  },
  menuContainer: {
    width: width * 0.8,
    height: "100%",
    backgroundColor: Theme.colors.background,
    ...Theme.shadows.lg,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: 60,
    paddingBottom: Theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  titleButton: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  closeButton: {
    padding: Theme.spacing.xs,
  },
  menuContent: {
    flex: 1,
    paddingTop: Theme.spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  menuItemActive: {
    backgroundColor: Theme.colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.lg,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  menuItemTitleActive: {
    color: Theme.colors.primary,
  },
  menuItemDescription: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    lineHeight: 16,
  },
  menuFooter: {
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  menuFooterText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
    textAlign: "center",
  },
});
