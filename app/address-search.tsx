import { Text } from "@/components/Themed";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function AddressSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialQuery?: string }>();
  const { colors } = useTheme();
  const [webViewReady, setWebViewReady] = useState(false);

  useEffect(() => {
    // WebView 준비 상태 확인을 위한 로그
    console.log("📍 주소 검색 화면 로드");
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          주소 검색
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* WebView */}
      {Platform.OS === "web" ? (
        <View style={styles.webContainer}>
          <Text style={{ padding: 16, color: colors.text }}>
            웹에서는 주소를 직접 입력해주세요.
          </Text>
        </View>
      ) : (
        <WebView
          source={{
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; }
    #wrap { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="wrap"></div>
  <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
  <script>
    (function() {
      var searchQuery = "${(params.initialQuery || "")
        .replace(/"/g, '\\"')
        .replace(/\n/g, " ")
        .trim()}";
      
      var postcode = new daum.Postcode({
        oncomplete: function(data) {
          console.log('🏠 주소 선택됨:', data);
          var addr = data.roadAddress || data.jibunAddress;
          if (data.buildingName) {
            addr += ' (' + data.buildingName + ')';
          }
          
          console.log('📤 전송할 주소:', addr);
          console.log('🔍 ReactNativeWebView 존재:', !!window.ReactNativeWebView);
          
          // ReactNativeWebView로 메시지 전송
          if (window.ReactNativeWebView) {
            var message = JSON.stringify({ 
              address: addr
            });
            console.log('📨 메시지 전송 시도:', message);
            
            try {
              window.ReactNativeWebView.postMessage(message);
              console.log('📨 메시지 전송 완료');
            } catch (e) {
              console.error('❌ 메시지 전송 오류:', e);
              // 재시도
              setTimeout(function() {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(message);
                  console.log('📨 메시지 재전송 완료');
                }
              }, 100);
            }

            // 메시지 전송 후 약간의 지연 뒤 검색창 닫기
            setTimeout(function() {
              try {
                if (postcode && typeof postcode.close === 'function') {
                  postcode.close();
                }
              } catch (e) {
                console.error('❌ postcode 닫기 오류:', e);
              }
            }, 150);
          } else {
            console.error('❌ ReactNativeWebView가 없습니다!');
            // 재시도
            setTimeout(function() {
              if (window.ReactNativeWebView) {
                var retryMessage = JSON.stringify({ address: addr });
                window.ReactNativeWebView.postMessage(retryMessage);
                console.log('📨 재시도 메시지 전송 완료');
                // 재시도 후 닫기
                setTimeout(function() {
                  try {
                    if (postcode && typeof postcode.close === 'function') {
                      postcode.close();
                    }
                  } catch (e) {}
                }, 150);
              }
            }, 500);
          }
        },
        onclose: function(state) {
          // 사용자가 취소한 경우
          if (window.ReactNativeWebView && state === 'COMPLETE_CLOSE') {
            // 취소 메시지 전송
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              cancelled: true 
            }));
          }
        },
        width: '100%',
        height: '100%'
      });
      
      postcode.embed(document.getElementById('wrap'), { 
        q: searchQuery || '',
        autoClose: false 
      });
      
      // ReactNativeWebView 준비 확인
      if (window.ReactNativeWebView) {
        console.log('✅ ReactNativeWebView 준비됨');
      }
    })();
  </script>
</body>
</html>
            `,
          }}
          style={styles.webView}
          onMessage={(event) => {
            console.log("🔍 WebView 메시지 수신:", event.nativeEvent.data);
            try {
              const data = JSON.parse(event.nativeEvent.data);
              console.log("📋 파싱된 데이터:", data);

              if (data.cancelled) {
                // 사용자가 취소한 경우
                console.log("❌ 주소 검색 취소됨");
                router.back();
                return;
              }

              if (data.address) {
                console.log("✅ 주소 선택됨:", data.address);
                // AsyncStorage에 주소 저장
                AsyncStorage.setItem("selectedAddress", data.address)
                  .then(() => {
                    console.log("✅ 주소가 저장되었습니다");
                    router.back();
                  })
                  .catch((error) => {
                    console.error("❌ 주소 저장 오류:", error);
                    router.back();
                  });
              }
            } catch (error) {
              console.error("❌ 주소 검색 메시지 파싱 오류:", error);
              console.error("원본 메시지:", event.nativeEvent.data);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={["*"]}
          scalesPageToFit={false}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          onLoadEnd={() => {
            console.log("✅ WebView 로드 완료");
            setWebViewReady(true);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("❌ WebView 오류:", nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("❌ WebView HTTP 오류:", nativeEvent);
          }}
          injectedJavaScript={`
            (function() {
              // console.log를 ReactNativeWebView로 리디렉션
              const originalLog = console.log;
              const originalError = console.error;
              console.log = function(...args) {
                originalLog.apply(console, args);
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'debug',
                    level: 'log',
                    message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
                  }));
                }
              };
              console.error = function(...args) {
                originalError.apply(console, args);
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'debug',
                    level: 'error',
                    message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
                  }));
                }
              };
              
              // ReactNativeWebView 준비 확인
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'debug',
                  level: 'log',
                  message: 'ReactNativeWebView 준비됨'
                }));
              }
            })();
            true;
          `}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  webContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  webView: {
    flex: 1,
  },
});
