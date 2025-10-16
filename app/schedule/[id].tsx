import { Text, View } from "@/components/Themed";
import { store } from "@/models/store";
import { calculatePayForWorker } from "@/models/types";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { FlatList, Linking, Pressable } from "react-native";

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const schedule = id ? store.get(String(id)) : undefined;

  if (!schedule) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>스케쥴을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
        {schedule.title}
      </Text>
      <Text style={{ marginBottom: 16 }}>{schedule.date}</Text>

      <FlatList
        data={schedule.workers}
        keyExtractor={(w) => w.worker.id}
        ListEmptyComponent={<Text>등록된 작업자가 없습니다.</Text>}
        renderItem={({ item }) => {
          const pay = calculatePayForWorker(
            item.worker.hourlyWage,
            item.periods,
            item.worker.taxWithheld,
            item.worker.taxRate
          );
          const copyAccountAndAmount = async () => {
            await Clipboard.setStringAsync(`${item.worker.bankAccount} ${pay}`);
          };
          const openKakaoOrSms = () => {
            if (item.worker.kakaoRoomUrl) {
              Linking.openURL(item.worker.kakaoRoomUrl);
              return;
            }
            Linking.openURL(`sms:${item.worker.phone}`);
          };
          const openBank = () => {
            // Attempt common KR apps; if not installed, fallback to web
            const urls = ["kakaobank://", "supertoss://", "toss://"];
            Linking.openURL(urls[0]).catch(() =>
              Linking.openURL(urls[1]).catch(() =>
                Linking.openURL(urls[2]).catch(() => {})
              )
            );
          };

          return (
            <View
              style={{
                backgroundColor: "#111827",
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                {item.worker.name}
              </Text>
              <Text style={{ color: "#cbd5e1" }}>{item.worker.phone}</Text>
              <Text style={{ color: "#cbd5e1" }}>
                계좌: {item.worker.bankAccount}
              </Text>
              <Text style={{ color: "#cbd5e1" }}>
                시급: {item.worker.hourlyWage.toLocaleString()}원
              </Text>
              <Text style={{ color: "#cbd5e1" }}>
                세금공제:{" "}
                {item.worker.taxWithheld
                  ? `${Math.round(item.worker.taxRate * 100)}%`
                  : "없음"}
              </Text>
              <Text style={{ color: "#93c5fd", marginTop: 8 }}>
                급여: {pay.toLocaleString()}원
              </Text>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Pressable
                  onPress={openKakaoOrSms}
                  style={{
                    backgroundColor: "#2563eb",
                    padding: 8,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: "white" }}>카톡/문자</Text>
                </Pressable>
                <Pressable
                  onPress={copyAccountAndAmount}
                  style={{
                    backgroundColor: "#10b981",
                    padding: 8,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: "white" }}>계좌+금액 복사</Text>
                </Pressable>
                <Pressable
                  onPress={openBank}
                  style={{
                    backgroundColor: "#f59e0b",
                    padding: 8,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: "white" }}>송금</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
