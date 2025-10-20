import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

interface AddressSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: string) => void;
  currentAddress?: string;
}

const AddressSearchModal: React.FC<AddressSearchModalProps> = ({
  visible,
  onClose,
  onSelectAddress,
  currentAddress = "",
}) => {
  const [webViewKey, setWebViewKey] = useState(0);
  const [addressInput, setAddressInput] = useState(currentAddress);

  const handleWebAddressSubmit = () => {
    if (!addressInput.trim()) {
      Alert.alert("알림", "주소를 입력해주세요.");
      return;
    }
    onSelectAddress(addressInput.trim());
    onClose();
  };

  const handleDaumPostcodeSearch = () => {
    if (Platform.OS === "web") {
      // 웹에서 다음 우편번호 서비스 열기
      const script = document.createElement("script");
      script.src =
        "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = () => {
        // 팝업 창으로 열기
        const popup = window.open(
          "",
          "postcodePopup",
          "width=500,height=600,scrollbars=yes,resizable=yes"
        );

        if (popup) {
          // 팝업 창에 HTML 작성
          popup.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>주소 검색</title>
              <style>
                body { margin: 0; padding: 0; }
                #postcode { width: 100%; height: 100vh; }
              </style>
            </head>
            <body>
              <div id="postcode"></div>
            </body>
            </html>
          `);
          popup.document.close();

          // 팝업이 완전히 로드된 후 다음 우편번호 서비스 초기화
          popup.onload = () => {
            // @ts-ignore
            new window.daum.Postcode({
              oncomplete: function (data: any) {
                console.log("팝업에서 선택된 주소:", data);

                let selectedAddress = "";
                if (data.roadAddress) {
                  selectedAddress = data.roadAddress;
                } else if (data.jibunAddress) {
                  selectedAddress = data.jibunAddress;
                } else if (data.address) {
                  selectedAddress = data.address;
                }

                if (data.buildingName) {
                  selectedAddress += ` (${data.buildingName})`;
                }

                // 선택된 주소를 텍스트 입력창에 설정
                setAddressInput(selectedAddress);
                onSelectAddress(selectedAddress);
                onClose();
                popup.close();
              },
              onclose: function (state: string) {
                console.log("팝업 닫힘:", state);
                if (state === "FORCE_CLOSE") {
                  popup.close();
                }
              },
              // 입력된 주소를 검색어로 사용
              q: addressInput.trim() || undefined,
            }).embed(popup.document.getElementById("postcode"));
          };
        }
      };

      script.onerror = () => {
        Alert.alert("오류", "주소 검색 서비스를 불러올 수 없습니다.");
      };

      document.head.appendChild(script);
    }
  };

  // 다음 우편번호 서비스 + 직접 입력 HTML
  const postcodeHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>주소 검색</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f8f9fa;
          height: 100vh;
          overflow: hidden;
        }
        .container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }
        .search-section {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        .search-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .search-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .search-subtitle {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }
        .search-input-section {
          margin-bottom: 24px;
        }
        .input-wrapper {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }
        .search-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: #f9fafb;
        }
        .search-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .search-button {
          padding: 12px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          white-space: nowrap;
        }
        .search-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .search-icon {
          font-size: 18px;
        }
        .search-results {
          max-height: 300px;
          overflow-y: auto;
          border: 2px solid #f3f4f6;
          border-radius: 16px;
          background: white;
          margin-bottom: 24px;
        }
        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #6b7280;
        }
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .empty-text {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #374151;
        }
        .empty-subtext {
          font-size: 14px;
          color: #9ca3af;
        }
        .search-result-item {
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .search-result-item:hover {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        .search-result-item:last-child {
          border-bottom: none;
        }
        .result-main-address {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 6px;
          font-size: 16px;
        }
        .result-jibun-address {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .result-zipcode {
          font-size: 12px;
          color: #9ca3af;
        }
        .result-building {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <div class="search-section">
            <div class="search-header">
              <h2 class="search-title">📍 주소 검색</h2>
              <p class="search-subtitle">원하는 주소를 검색하고 선택하세요</p>
            </div>
            
            <div class="search-input-section">
              <div class="input-wrapper">
                <input 
                  type="text" 
                  id="search-input" 
                  placeholder="주소를 입력하세요 (예: 강남구 테헤란로)"
                  class="search-input"
                />
                <button 
                  onclick="searchAddress()" 
                  class="search-button"
                >
                  <span class="search-icon">🔍</span>
                  검색
                </button>
              </div>
            </div>

            <div id="search-results" class="search-results">
              <div class="empty-state">
                <div class="empty-icon">🏠</div>
                <div class="empty-text">주소를 입력하고 검색해보세요</div>
                <div class="empty-subtext">도로명주소, 건물명, 지번주소로 검색할 수 있습니다</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <script>
        // 다음 서비스 스크립트 동적 로드
        function loadDaumScript() {
          return new Promise((resolve, reject) => {
            if (typeof daum !== 'undefined' && daum.Postcode) {
              console.log('다음 서비스 이미 로드됨');
              resolve();
              return;
            }

            console.log('다음 서비스 스크립트 로드 시작...');
            const script = document.createElement('script');
            script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
            script.onload = () => {
              console.log('다음 서비스 스크립트 로드 완료');
              resolve();
            };
            script.onerror = () => {
              console.error('다음 서비스 스크립트 로드 실패');
              reject(new Error('다음 서비스 스크립트 로드 실패'));
            };
            document.head.appendChild(script);
          });
        }

        // 스크립트 로드 후 초기화
        loadDaumScript().then(() => {
          console.log('다음 서비스 스크립트 로드 성공, 초기화 시작');
          // 초기화는 tryLoadDaumPostcode에서 처리
        }).catch((error) => {
          console.error('다음 서비스 스크립트 로드 실패:', error);
        });
      </script>
      <script>
        // 다음 서비스 관련 변수들은 제거됨 (외부 브라우저 사용)

        function switchTab(tabName) {
          // 탭 버튼 상태 변경
          document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
          
          event.target.classList.add('active');
          document.getElementById(tabName + '-tab').classList.add('active');
        }

        // 다음 서비스 관련 함수들은 제거됨 (외부 브라우저 사용)

        function selectExample(address) {
          document.getElementById('address-input').value = address;
        }

        function submitAddress() {
          const input = document.getElementById('address-input');
          const address = input.value.trim();
          
          if (!address) {
            alert('주소를 입력해주세요.');
            return;
          }

          const message = JSON.stringify({
            type: 'ADDRESS_SELECTED',
            data: { 
              roadAddress: address, 
              address: address 
            }
          });

          console.log('직접 입력 - 주소 제출:', address);
          console.log('직접 입력 - 메시지 전송 시도:', message);
          
          // 전역 함수 사용 (더 안전함)
          if (window.sendToReactNative) {
            const success = window.sendToReactNative(message);
            if (!success) {
              alert('주소 전달 실패: ReactNativeWebView 연결 오류\\n주소: ' + address);
            }
          } else {
            // 전역 함수가 없으면 직접 시도
            try {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(message);
                console.log('직접 메시지 전송 성공!');
              } else {
                console.error('ReactNativeWebView를 찾을 수 없습니다.');
                alert('주소 전달 실패: ReactNativeWebView가 없습니다.\\n주소: ' + address);
              }
            } catch (error) {
              console.error('메시지 전송 오류:', error);
              alert('주소 전달 오류: ' + error.message + '\\n주소: ' + address);
            }
          }
        }

        function openExternal() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'OPEN_EXTERNAL'
            }));
          }
        }

        function searchAddress() {
          const input = document.getElementById('search-input');
          const query = input.value.trim();
          
          if (!query) {
            return;
          }

          console.log('주소 검색 시작:', query);
          
          // 검색 결과 영역 업데이트
          const resultsDiv = document.getElementById('search-results');
          resultsDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">검색 중...</div>';

          // 다음 우편번호 서비스 API 호출 (CORS 프록시 사용)
          const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
          const apiUrl = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
          
          // 대신 간단한 주소 검색 API 사용 (공공데이터포털 또는 다른 서비스)
          // 여기서는 예시로 간단한 주소 목록을 사용
          searchAddressWithAPI(query);
        }

        async function searchAddressWithAPI(query) {
          try {
            // 공공데이터포털 주소검색 API 사용
            // 실제 API 키가 필요하지만, 여기서는 예시로 구현
            const apiKey = 'YOUR_API_KEY'; // 실제 API 키로 교체 필요
            const apiUrl = \`https://www.juso.go.kr/addrlink/addrLinkApi.do?confmKey=\${apiKey}&currentPage=1&countPerPage=10&keyword=\${encodeURIComponent(query)}&resultType=json\`;
            
            // CORS 문제로 인해 실제 API 호출이 어려우므로, 
            // 여기서는 예시 데이터를 사용하되 실제 주소 형태로 생성
            const mockResults = generateMockAddresses(query);
            displaySearchResults(mockResults);
            
            // 실제 API 호출 (API 키가 있는 경우)
            /*
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.results && data.results.juso) {
              const results = data.results.juso.map(juso => ({
                roadAddress: juso.roadAddr,
                jibunAddress: juso.jibunAddr,
                zonecode: juso.zipNo,
                buildingName: juso.bdNm || ''
              }));
              displaySearchResults(results);
            } else {
              displaySearchResults([]);
            }
            */
          } catch (error) {
            console.error('주소 검색 API 오류:', error);
            displaySearchResults([]);
          }
        }

        function generateMockAddresses(query) {
          // 실제 주소 형태로 예시 데이터 생성
          const addresses = [
            {
              roadAddress: \`서울특별시 \${query} 123\`,
              jibunAddress: \`서울특별시 \${query} 123-1\`,
              zonecode: '12345',
              buildingName: '테스트빌딩'
            },
            {
              roadAddress: \`서울특별시 \${query} 456\`,
              jibunAddress: \`서울특별시 \${query} 456-1\`,
              zonecode: '12346',
              buildingName: '샘플빌딩'
            },
            {
              roadAddress: \`서울특별시 \${query} 789\`,
              jibunAddress: \`서울특별시 \${query} 789-1\`,
              zonecode: '12347',
              buildingName: '예시빌딩'
            },
            {
              roadAddress: \`서울특별시 \${query} 101\`,
              jibunAddress: \`서울특별시 \${query} 101-1\`,
              zonecode: '12348',
              buildingName: '데모빌딩'
            },
            {
              roadAddress: \`서울특별시 \${query} 202\`,
              jibunAddress: \`서울특별시 \${query} 202-1\`,
              zonecode: '12349',
              buildingName: '샘플오피스'
            }
          ];

          return addresses;
        }

        function displaySearchResults(results) {
          const resultsDiv = document.getElementById('search-results');
          
          if (results.length === 0) {
            resultsDiv.innerHTML = \`
              <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-text">검색 결과가 없습니다</div>
                <div class="empty-subtext">다른 키워드로 다시 검색해보세요</div>
              </div>
            \`;
            return;
          }

          let html = '';
          results.forEach((result, index) => {
            html += \`
              <div 
                class="search-result-item"
                onclick="selectSearchResult('\${result.roadAddress}', '\${result.jibunAddress}', '\${result.zonecode}', '\${result.buildingName}')"
              >
                <div class="result-main-address">\${result.roadAddress}</div>
                <div class="result-jibun-address">지번: \${result.jibunAddress}</div>
                <div class="result-zipcode">우편번호: \${result.zonecode}</div>
                \${result.buildingName ? \`<div class="result-building">건물명: \${result.buildingName}</div>\` : ''}
              </div>
            \`;
          });

          resultsDiv.innerHTML = html;
        }

        function selectSearchResult(roadAddress, jibunAddress, zonecode, buildingName) {
          console.log('주소 선택됨:', roadAddress);
          
          const message = JSON.stringify({
            type: 'ADDRESS_SELECTED',
            data: {
              roadAddress: roadAddress,
              address: roadAddress,
              jibunAddress: jibunAddress,
              zoneCode: zonecode,
              buildingName: buildingName
            }
          });

          // 전역 함수 사용
          if (window.sendToReactNative) {
            const success = window.sendToReactNative(message);
            if (!success) {
              console.error('주소 전달 실패: ReactNativeWebView 연결 오류');
            }
          } else {
            // 전역 함수가 없으면 직접 시도
            try {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(message);
                console.log('직접 메시지 전송 성공!');
              } else {
                console.error('ReactNativeWebView를 찾을 수 없습니다.');
              }
            } catch (error) {
              console.error('메시지 전송 오류:', error);
            }
          }
        }


        // 검색 입력 필드 엔터키 이벤트
        document.addEventListener('DOMContentLoaded', function() {
          const searchInput = document.getElementById('search-input');
          if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
              if (e.key === 'Enter') {
                searchAddress();
              }
            });
          }
        });

        // 다음 서비스는 외부 브라우저에서 사용

        // ReactNativeWebView 확인 및 전역 함수 등록
        function checkReactNativeWebView() {
          console.log('ReactNativeWebView 체크:', typeof window.ReactNativeWebView !== 'undefined');
          console.log('postMessage 함수 존재:', typeof window.ReactNativeWebView?.postMessage === 'function');
          
          // 전역 함수로 등록하여 다음 서비스에서 사용 가능하도록 함
          window.sendToReactNative = function(message) {
            console.log('sendToReactNative 호출됨:', message);
            try {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(message);
                console.log('전역 함수로 메시지 전송 성공!');
                return true;
              } else {
                console.error('ReactNativeWebView를 찾을 수 없습니다.');
                return false;
              }
            } catch (error) {
              console.error('전역 함수 메시지 전송 오류:', error);
              return false;
            }
          };
        }

        // 주기적으로 ReactNativeWebView 확인
        setTimeout(checkReactNativeWebView, 1000);
        setTimeout(checkReactNativeWebView, 2000);
        setTimeout(checkReactNativeWebView, 3000);

        console.log('주소 검색 페이지 로드 완료');
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      console.log("=== WebView 메시지 수신 ===");
      console.log("원본 데이터:", event.nativeEvent.data);

      const message = JSON.parse(event.nativeEvent.data);
      console.log("파싱된 메시지:", message);

      if (message.type === "ADDRESS_SELECTED") {
        const addressData = message.data;
        const selectedAddress = addressData.roadAddress || addressData.address;
        console.log("최종 선택된 주소:", selectedAddress);

        // 주소 선택 후 즉시 처리
        onSelectAddress(selectedAddress);
        console.log("onSelectAddress 호출 완료");

        onClose();
        console.log("onClose 호출 완료");
      }
    } catch (error) {
      console.error("메시지 처리 오류:", error);
      Alert.alert("오류", "주소 처리 중 오류가 발생했습니다: " + error);
    }
  };

  const handleClose = () => {
    setWebViewKey((prev) => prev + 1); // WebView 리셋
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleClose}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </Pressable>
          <Text style={styles.headerTitle}>주소 검색</Text>
        </View>

        {Platform.OS === "web" ? (
          // 웹용 간단한 주소 입력 폼
          <View style={styles.webContainer}>
            <View style={styles.webContent}>
              <Text style={styles.webTitle}>📍 주소를 입력하세요</Text>
              <Text style={styles.webSubtitle}>
                도로명주소, 건물명, 지번주소로 검색할 수 있습니다
              </Text>

              <View style={styles.webInputContainer}>
                <TextInput
                  style={styles.webInput}
                  placeholder="주소를 입력하세요 (예: 강남구 테헤란로)"
                  value={addressInput}
                  onChangeText={setAddressInput}
                  multiline={false}
                />
                <Pressable
                  style={styles.webSearchButton}
                  onPress={handleDaumPostcodeSearch}
                >
                  <Ionicons name="search" size={20} color="white" />
                  <Text style={styles.webSearchButtonText}>주소 검색</Text>
                </Pressable>
              </View>

              <View style={styles.webButtonContainer}>
                <Pressable style={styles.webCancelButton} onPress={onClose}>
                  <Text style={styles.webCancelButtonText}>취소</Text>
                </Pressable>
                <Pressable
                  style={styles.webConfirmButton}
                  onPress={handleWebAddressSubmit}
                >
                  <Text style={styles.webConfirmButtonText}>확인</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          // 모바일용 WebView
          <WebView
            key={webViewKey}
            source={{ html: postcodeHTML }}
            style={styles.webView}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={false}
            allowsInlineMediaPlayback={false}
            mediaPlaybackRequiresUserAction={false}
            allowsBackForwardNavigationGestures={false}
            originWhitelist={["*"]}
            injectedJavaScript={`
              // ReactNativeWebView가 있는지 확인
              console.log('WebView 초기화 완료');
              console.log('ReactNativeWebView 존재:', typeof window.ReactNativeWebView !== 'undefined');
              true; // 반드시 true를 반환해야 함
            `}
            onError={(error) => {
              console.error("WebView 오류:", error);
              Alert.alert("오류", "주소 입력 화면을 불러올 수 없습니다.");
            }}
            onLoadEnd={() => {
              console.log("주소 입력 화면 로드 완료");
            }}
            onLoadStart={() => {
              console.log("주소 입력 화면 로드 시작");
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 16,
  },
  webView: {
    flex: 1,
  },
  // 웹용 스타일
  webContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  webContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  webSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
  },
  webInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  webInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  webSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  webSearchButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  webButtonContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  webCancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    minWidth: 80,
    alignItems: "center",
  },
  webCancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  webConfirmButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    minWidth: 80,
    alignItems: "center",
  },
  webConfirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AddressSearchModal;
