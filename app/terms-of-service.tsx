import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={Theme.colors.text.primary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>이용약관</Text>
      </View>

      {/* 내용 */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.updateDate}>최종 수정일: 2025년 1월 21일</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제 1 조 (목적)</Text>
          <Text style={styles.sectionContent}>
            본 약관은 리밋 플래너(이하 "서비스")가 제공하는 근로자 및 스케줄
            관리 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및
            책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제 2 조 (용어의 정의)</Text>
          <Text style={styles.sectionContent}>
            1. "서비스"란 리밋 플래너가 제공하는 근로자 관리, 스케줄 관리, 급여
            계산 등의 모든 서비스를 의미합니다.{"\n\n"}
            2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원
            및 비회원을 말합니다.{"\n\n"}
            3. "회원"이란 서비스에 접속하여 본 약관에 따라 회사와 이용계약을
            체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.{"\n\n"}
            4. "데이터"란 이용자가 서비스를 이용하면서 입력한 근로자 정보,
            스케줄 정보, 급여 정보 등을 의미합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제 3 조 (약관의 효력 및 변경)</Text>
          <Text style={styles.sectionContent}>
            1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이
            발생합니다.{"\n\n"}
            2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본
            약관을 변경할 수 있으며, 약관이 변경되는 경우 서비스 내 공지사항
            또는 이메일을 통해 공지합니다.{"\n\n"}
            3. 변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하고 회원
            탈퇴를 요청할 수 있습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            제 4 조 (서비스의 제공 및 변경)
          </Text>
          <Text style={styles.sectionContent}>
            1. 회사는 다음과 같은 서비스를 제공합니다:{"\n"}
            　• 근로자 정보 관리{"\n"}
            　• 스케줄 및 일정 관리{"\n"}
            　• 급여 계산 및 관리{"\n"}
            　• 거래처 관리{"\n"}
            　• 보고서 생성{"\n\n"}
            2. 회사는 상당한 이유가 있는 경우 운영상, 기술상의 필요에 따라
            제공하고 있는 서비스의 전부 또는 일부를 변경할 수 있습니다.{"\n\n"}
            3. 서비스의 내용, 이용방법, 이용시간에 대하여 변경이 있는 경우에는
            변경사유, 변경될 서비스의 내용 및 제공일자 등을 사전에 공지합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제 5 조 (서비스의 중단)</Text>
          <Text style={styles.sectionContent}>
            1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의
            두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할
            수 있습니다.{"\n\n"}
            2. 제1항에 의한 서비스 중단의 경우에는 회사는 사전에 공지합니다.
            다만, 회사가 통제할 수 없는 사유로 인한 서비스의 중단으로 인하여
            사전 통지가 불가능한 경우에는 그러하지 아니합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제 6 조 (회원가입)</Text>
          <Text style={styles.sectionContent}>
            1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본
            약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.{"\n\n"}
            2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각
            호에 해당하지 않는 한 회원으로 등록합니다:{"\n"}
            　• 등록 내용에 허위, 기재누락, 오기가 있는 경우{"\n"}
            　• 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고
            판단되는 경우
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            제 7 조 (회원 탈퇴 및 자격 상실)
          </Text>
          <Text style={styles.sectionContent}>
            1. 회원은 언제든지 서비스 내 설정 메뉴를 통하여 탈퇴를 요청할 수
            있으며, 회사는 즉시 회원 탈퇴를 처리합니다.{"\n\n"}
            2. 회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한
            및 정지시킬 수 있습니다:{"\n"}
            　• 가입 신청 시 허위 내용을 등록한 경우{"\n"}
            　• 다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등
            전자상거래 질서를 위협하는 경우{"\n"}
            　• 서비스를 이용하여 법령 또는 본 약관이 금지하거나 공서양속에
            반하는 행위를 하는 경우
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제 8 조 (회원의 의무)</Text>
          <Text style={styles.sectionContent}>
            1. 회원은 다음 행위를 하여서는 안 됩니다:{"\n"}
            　• 신청 또는 변경 시 허위내용의 등록{"\n"}
            　• 타인의 정보 도용{"\n"}
            　• 회사가 게시한 정보의 변경{"\n"}
            　• 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는
            게시{"\n"}
            　• 회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해{"\n"}
            　• 회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위
            {"\n\n"}
            2. 회원은 관계 법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여
            공지한 주의사항, 회사가 통지하는 사항 등을 준수하여야 합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제 9 조 (개인정보보호)</Text>
          <Text style={styles.sectionContent}>
            회사는 관계 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해
            노력합니다. 개인정보의 보호 및 이용에 대해서는 관련 법령 및 회사의
            개인정보처리방침이 적용됩니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제 10 조 (회사의 의무)</Text>
          <Text style={styles.sectionContent}>
            1. 회사는 관련 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를
            하지 않으며, 지속적이고 안정적으로 서비스를 제공하기 위하여 최선을
            다하여 노력합니다.{"\n\n"}
            2. 회사는 이용자의 개인정보 보호를 위해 보안시스템을 구축하며
            개인정보처리방침을 공시하고 준수합니다.{"\n\n"}
            3. 회사는 서비스 이용과 관련하여 이용자로부터 제기된 의견이나 불만이
            정당하다고 인정할 경우 이를 처리하여야 합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            제 11 조 (저작권의 귀속 및 이용제한)
          </Text>
          <Text style={styles.sectionContent}>
            1. 회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에
            귀속합니다.{"\n\n"}
            2. 이용자는 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이
            귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송
            기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게
            하여서는 안 됩니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제 12 조 (면책조항)</Text>
          <Text style={styles.sectionContent}>
            1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를
            제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
            {"\n\n"}
            2. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여
            책임을 지지 않습니다.{"\n\n"}
            3. 회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에
            대하여 책임을 지지 않으며, 그 밖에 서비스를 통하여 얻은 자료로 인한
            손해에 관하여 책임을 지지 않습니다.{"\n\n"}
            4. 회사는 이용자가 입력한 데이터의 정확성, 완전성, 신뢰성을 보장하지
            않습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제 13 조 (분쟁해결)</Text>
          <Text style={styles.sectionContent}>
            1. 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그
            피해를 보상처리하기 위하여 피해보상처리기구를 설치, 운영합니다.
            {"\n\n"}
            2. 회사와 이용자 간에 발생한 분쟁은 전자문서 및 전자거래 기본법
            제32조 및 동 시행령 제15조에 의하여 설치된
            전자문서·전자거래분쟁조정위원회의 조정에 따를 수 있습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제 14 조 (재판권 및 준거법)</Text>
          <Text style={styles.sectionContent}>
            1. 회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소
            당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는
            지방법원의 전속관할로 합니다.{"\n\n"}
            2. 회사와 이용자 간에 제기된 전자상거래 소송에는 대한민국 법을
            적용합니다.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            본 약관은 2025년 1월 21일부터 적용됩니다.
          </Text>
          <Text style={styles.footerText}>리밋 플래너 운영팀</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
    backgroundColor: Theme.colors.card,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginRight: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.xl,
  },
  updateDate: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.tertiary,
    marginBottom: Theme.spacing.xl,
    textAlign: "right",
  },
  section: {
    marginBottom: Theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  sectionContent: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    lineHeight: 24,
  },
  footer: {
    marginTop: Theme.spacing.xxl,
    paddingTop: Theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  footerText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.tertiary,
  },
});
