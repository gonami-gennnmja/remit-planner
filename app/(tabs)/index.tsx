import PlannerCalendar from "@/components/PlannerCalendar";
import { Text } from "@/components/Themed";
import { store } from "@/models/store";
import { Schedule } from "@/models/types";
import { Link } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable } from "react-native";
import { DateData } from "react-native-calendars";

type AgendaItems = Record<string, Schedule[]>;

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Seed example for first load (noop on subsequent renders)
  useMemo(() => {
    if (!store.get("demo-1")) {
      store.seed([
        {
          id: "demo-1",
          title: "현장 A",
          date: selectedDate,
          description: "샘플 스케쥴",
          category: "event",
          workers: [
            {
              worker: {
                id: "w1",
                name: "김철수",
                phone: "010-1234-5678",
                bankAccount: "카카오 3333-01-1234567",
                hourlyWage: 20000,
                taxWithheld: true,
                taxRate: 0.033,
              },
              periods: [
                {
                  start: `${selectedDate}T15:00:00+09:00`,
                  end: `${selectedDate}T17:00:00+09:00`,
                },
              ],
              paid: false,
            },
          ],
        },
        {
          id: "demo-2",
          title: "교육 세션",
          date: selectedDate,
          description: "신규 인입 교육",
          category: "education",
          workers: [
            {
              worker: {
                id: "w2",
                name: "박영희",
                phone: "010-2222-3333",
                bankAccount: "토스 1000-22-333333",
                hourlyWage: 22000,
                taxWithheld: false,
                taxRate: 0,
              },
              periods: [
                {
                  start: `${selectedDate}T13:30:00+09:00`,
                  end: `${selectedDate}T16:00:00+09:00`,
                },
              ],
              paid: false,
            },
          ],
        },
      ]);
    }
  }, [selectedDate]);

  // Keep a stable reference for Agenda.items to avoid internal mutation loops
  const itemsRef = useRef<AgendaItems>({});

  useEffect(() => {
    const schedules = store.listByDate(selectedDate);
    // mutate ref in place so reference stays stable
    itemsRef.current[selectedDate] = schedules;
  }, [selectedDate]);

  const renderItem = (item: Schedule) => (
    <Link href={`/schedule/${item.id}`} asChild>
      <Pressable
        style={{
          backgroundColor: "#1f2937",
          padding: 12,
          borderRadius: 8,
          marginRight: 10,
          marginTop: 17,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>{item.title}</Text>
        {item.description ? (
          <Text style={{ color: "#cbd5e1" }}>{item.description}</Text>
        ) : null}
      </Pressable>
    </Link>
  );

  const onDayPress = (day: DateData) => {
    if (day.dateString !== selectedDate) {
      setSelectedDate(day.dateString);
    }
  };

  return <PlannerCalendar />;
}
