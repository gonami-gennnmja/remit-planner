import { Text } from "@/components/Themed";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { Worker } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

export interface ScheduleWorkerInput {
  worker: Worker;
  hourlyWage?: number;
  uniformTime: boolean;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
}

interface WorkersAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (workers: ScheduleWorkerInput[]) => void;
  scheduleStartDate: string;
  scheduleEndDate: string;
}

export default function WorkersAddModal({
  visible,
  onClose,
  onSave,
  scheduleStartDate,
  scheduleEndDate,
}: WorkersAddModalProps) {
  const { colors } = useTheme();
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, ScheduleWorkerInput>>(
    {}
  );
  const [uniformTime, setUniformTime] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const db = getDatabase();
        const workers = await db.getAllWorkers();
        setAllWorkers(workers);
      } catch (e) {
        console.error("Failed to load workers:", e);
      }
    })();
  }, [visible]);

  useEffect(() => {
    // reset times per open
    if (visible) {
      setUniformTime(true);
      setStartTime("09:00");
      setEndTime("18:00");
    }
  }, [visible]);

  const filtered = useMemo(() => {
    return allWorkers.filter((w) =>
      search ? w.name.toLowerCase().includes(search.toLowerCase()) : true
    );
  }, [allWorkers, search]);

  const toggleSelect = (worker: Worker) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[worker.id]) {
        delete next[worker.id];
      } else {
        next[worker.id] = {
          worker,
          hourlyWage: worker.hourlyWage,
          uniformTime: true,
          startTime: startTime,
          endTime: endTime,
        };
      }
      return next;
    });
  };

  const updateWage = (workerId: string, text: string) => {
    const amount = parseInt(text.replace(/[^0-9]/g, "")) || 0;
    setSelected((prev) => ({
      ...prev,
      [workerId]: { ...prev[workerId], hourlyWage: amount },
    }));
  };

  const handleSave = () => {
    const list = Object.values(selected).map((item) => ({
      ...item,
      uniformTime: true,
      startTime,
      endTime,
    }));
    if (list.length === 0) {
      Alert.alert("알림", "추가할 근로자를 선택해주세요.");
      return;
    }
    onSave(list);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>근로자 추가</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </Pressable>
          </View>

          <TextInput
            style={[styles.input, { marginBottom: 8 }]}
            placeholder="근로자 검색"
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.row}>
            <Text style={styles.label}>시간 동일</Text>
            <Pressable
              onPress={() => setUniformTime((v) => !v)}
              style={[
                styles.toggle,
                { backgroundColor: uniformTime ? colors.primary : "#cbd5e1" },
              ]}
            >
              <View
                style={[styles.thumb, { marginLeft: uniformTime ? 20 : 0 }]}
              />
            </Pressable>
          </View>

          {uniformTime && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="시작 (HH:MM)"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="종료 (HH:MM)"
              />
            </View>
          )}

          <ScrollView style={{ maxHeight: 360 }}>
            {filtered.map((w) => {
              const picked = !!selected[w.id];
              return (
                <Pressable
                  key={w.id}
                  onPress={() => toggleSelect(w)}
                  style={[
                    styles.workerItem,
                    {
                      borderColor: picked ? colors.primary : "#e5e7eb",
                      borderWidth: picked ? 2 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workerName}>{w.name}</Text>
                    {!!w.phone && (
                      <Text style={styles.workerSub}>{w.phone}</Text>
                    )}
                  </View>
                  <TextInput
                    style={[styles.wageInput]}
                    value={(
                      selected[w.id]?.hourlyWage ??
                      w.hourlyWage ??
                      0
                    ).toLocaleString()}
                    onChangeText={(t) => updateWage(w.id, t)}
                    placeholder="시급"
                    keyboardType="numeric"
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveText}>추가</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  workerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  workerName: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  workerSub: {
    fontSize: 12,
    color: "#6b7280",
  },
  wageInput: {
    width: 110,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    textAlign: "right",
  },
  saveBtn: {
    marginTop: 8,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
  },
  saveText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
