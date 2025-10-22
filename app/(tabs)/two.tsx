import { useEffect, useState } from "react";
import { Alert } from "react-native";

import WorkersScreen from "@/components/WorkersScreen";
import { Schedule } from "@/models/types";
import dayjs from "dayjs";

export default function TabTwoScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allWorkers, setAllWorkers] = useState<any[]>([]);

  // 근로자 추가 함수
  const handleAddWorker = (newWorker: any) => {
    console.log("새 근로자 추가:", newWorker);

    // 모든 근로자 목록에 추가
    setAllWorkers((prev) => [...prev, newWorker]);

    // 기존 스케줄에도 추가 (첫 번째 스케줄에 임시로 추가)
    if (schedules.length > 0) {
      const updatedSchedules = schedules.map((schedule, index) => {
        if (index === 0) {
          // 첫 번째 스케줄에 추가
          return {
            ...schedule,
            workers: [
              ...(schedule.workers || []),
              {
                worker: {
                  id: newWorker.id,
                  name: newWorker.name,
                  phone: newWorker.phone,
                  bankAccount: newWorker.bankAccount,
                  hourlyWage: newWorker.hourlyWage,
                  taxWithheld: newWorker.taxWithheld,
                },
                periods: [
                  {
                    id: `p${Date.now()}`,
                    start: `${schedule.date}T09:00:00+09:00`,
                    end: `${schedule.date}T17:00:00+09:00`,
                  },
                ],
                paid: false,
              },
            ],
          };
        }
        return schedule;
      });

      setSchedules(updatedSchedules);
    }

    Alert.alert("성공", `${newWorker.name}님이 추가되었습니다.`);
  };

  // 근로자 수정 함수
  const handleUpdateWorker = (workerId: string, updates: any) => {
    console.log("근로자 수정:", workerId, updates);

    // 모든 근로자 목록에서 수정
    setAllWorkers((prev) =>
      prev.map((worker) =>
        worker.id === workerId ? { ...worker, ...updates } : worker
      )
    );

    // 스케줄의 근로자 정보도 수정
    const updatedSchedules = schedules.map((schedule) => ({
      ...schedule,
      workers: (schedule.workers || []).map((workerInfo) =>
        workerInfo.worker.id === workerId
          ? {
              ...workerInfo,
              worker: {
                ...workerInfo.worker,
                ...updates,
              },
            }
          : workerInfo
      ),
    }));

    setSchedules(updatedSchedules);
    Alert.alert("성공", "근로자 정보가 수정되었습니다.");
  };

  // 정적 테스트 데이터 (PlannerCalendar와 동일)
  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");

    const testSchedules: Schedule[] = [
      {
        id: "1",
        title: "수학 과외",
        date: today,
        description: "고등학교 2학년 수학 과외",
        category: "education",
        workers: [
          {
            worker: {
              id: "w1",
              name: "김선생",
              phone: "010-1234-5678",
              bankAccount: "110-1234-5678",
              hourlyWage: 50000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "p1",
                start: `${today}T14:00:00+09:00`,
                end: `${today}T16:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      {
        id: "2",
        title: "영어 회화",
        date: today,
        description: "성인 영어 회화 수업",
        category: "education",
        workers: [
          {
            worker: {
              id: "w2",
              name: "Sarah Johnson",
              phone: "010-9876-5432",
              bankAccount: "3333-12-3456789",
              hourlyWage: 80000,
              taxWithheld: false,
            },
            periods: [
              {
                id: "p2",
                start: `${today}T19:00:00+09:00`,
                end: `${today}T21:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      {
        id: "3",
        title: "프로젝트 회의",
        date: tomorrow,
        description: "웹 개발 프로젝트 진행 회의",
        category: "meeting",
        workers: [
          {
            worker: {
              id: "w3",
              name: "이개발",
              phone: "010-5555-1234",
              bankAccount: "1002-123-456789",
              hourlyWage: 100000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "p3",
                start: `${tomorrow}T10:00:00+09:00`,
                end: `${tomorrow}T12:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
    ];

    setSchedules(testSchedules);

    // 초기 근로자 데이터를 allWorkers에도 설정
    const initialWorkers = testSchedules.flatMap((schedule) =>
      (schedule.workers || []).map((workerInfo) => workerInfo.worker)
    );
    setAllWorkers(initialWorkers);
  }, []);

  return (
    <WorkersScreen
      schedules={schedules}
      allWorkers={allWorkers}
      onAddWorker={handleAddWorker}
      onUpdateWorker={handleUpdateWorker}
    />
  );
}
