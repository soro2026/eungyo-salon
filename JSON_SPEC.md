# 은교살롱 씨앗 JSON 규격서
> 필레몬 작성 · 2026.04.15
> **새 씨앗 만들 때, 필레몬이 검토할 때 반드시 이 규격 참조**

---

## ⚠️ 핵심 규칙 (어기면 게임 전체 크래시)

모든 씨앗 JSON은 반드시 아래 **최상위 구조**를 따라야 합니다.

```json
{
  "seed": "문",
  "seed_en": "mun",
  "total": 72,
  "questions": [ ... ]
}
```

- **절대 금지**: 최상위가 배열(`[...]`)이면 `loadQuestions()`가 크래시 남
- `total`은 반드시 `questions` 배열 길이와 일치해야 함

---

## 개별 문제 필드 규격

```json
{
  "seed_id":     "mun_01",
  "category":    "문학 · 종이 위의 인간",
  "difficulty":  1,
  "zone_keyword": "🚪 평생 기다린 문",
  "keyword":     "법 앞에서",
  "text":        "문제 텍스트 (경어체, 존댓말)",
  "answer":      "카프카",
  "display":     "카프카",
  "boxes":       3,
  "initials":    ["ㅋ", "ㅍ", "ㅋ"],
  "figures":     ["프란츠 카프카"],
  "library": {
    "knowledge": "지식 레이어 텍스트",
    "thought":   "사유 레이어 텍스트",
    "connection":"연결 레이어 텍스트",
    "curation":  "큐레이션 레이어 텍스트"
  }
}
```

### 필드별 규칙

| 필드 | 타입 | 필수 | 규칙 |
|------|------|------|------|
| seed_id | string | ✅ | `씨앗영문_번호` 형식. 예: mun_01 |
| category | string | ✅ | `대분류 · 소분류` 형식 (가운데점 앞뒤 공백) |
| difficulty | number | ✅ | 1, 2, 3 중 하나. 씨앗당 난이도별 균등 분배 |
| zone_keyword | string | ✅ | 이모지 + 힌트 문구. 정답이 직접 노출되면 안 됨 |
| keyword | string | ✅ | 문제 키워드 (존 보드 표시용) |
| text | string | ✅ | **반드시 경어체(존댓말)**. 평어 절대 금지 |
| answer | string | ✅ | 정답 (norm() 처리 후 비교: 공백/특수문자 제거, 소문자) |
| display | string | ✅ | 화면에 표시할 정답 (한자·외래어 병기 가능) |
| boxes | number | ✅ | **initials 배열 길이와 반드시 일치** |
| initials | array | ✅ | 자음 힌트 배열. 길이 = boxes |
| figures | array | ✅ | 관련 인물 목록 (콘스텔라티오 별 생성용) |
| library | object | ✅ | 4레이어 해설 (없으면 빈 객체 `{}` 허용) |

---

## boxes ↔ initials 규칙 (자주 틀리는 부분)

```
answer: "카프카"  → boxes: 3, initials: ["ㅋ", "ㅍ", "ㅋ"]  ✅
answer: "카프카"  → boxes: 3, initials: ["ㅋ", "ㅍ"]        ❌ (길이 불일치)
answer: "카프카"  → boxes: 2, initials: ["ㅋ", "ㅍ", "ㅋ"]  ❌ (boxes 불일치)
```

---

## 현재 씨앗 목록 및 상태

| 파일명 | 씨앗 | 문제수 | 구조 | 상태 |
|--------|------|--------|------|------|
| questions_taeyang.json | 태양 | 36 | ✅ | GitHub ✅ |
| questions_gil.json | 길 | 36 | ✅ | GitHub ✅ |
| questions_bada.json | 바다 | 36 | ✅ | GitHub ✅ |
| questions_terra.json | 흙 | 36 | ✅ | GitHub ✅ |
| questions_bam.json | 밤 | 36 | ✅ | GitHub ✅ |
| questions_bul.json | 불 | 36 | ✅ | GitHub ✅ |
| questions_namu.json | 나무 | 36 | ✅ seed_en/total 보정됨 | 재업로드 필요 |
| questions_dol.json | 돌 | 36 | ✅ seed_en/total 보정됨 | 재업로드 필요 |
| questions_baram.json | 바람 | 72 | ✅ | GitHub ✅ |
| questions_geoul.json | 거울 | 72 | ✅ | GitHub ✅ |
| questions_mun.json | 문(門) | 72 | ✅ 배열→객체 변환됨 | 재업로드 필요 |

---

## 새 씨앗 만들 때 필레몬 체크리스트

새 씨앗 JSON 파일 받으면 필레몬이 반드시 아래를 확인:

```
1. 최상위 구조가 {seed, seed_en, total, questions:[]} 인가?
2. total == questions.length 인가?
3. 모든 문제에 필수 필드 8개가 있는가?
4. boxes == initials.length 가 모든 문제에서 일치하는가?
5. text가 경어체인가? (이야/거야/했어 등 평어 없는지)
6. zone_keyword에 정답이 직접 노출되지 않는가?
7. figures 필드가 있는가? (콘스텔라티오 연동)
```

---

## 자주 발생한 버그 사례

| 날짜 | 파일 | 버그 | 원인 |
|------|------|------|------|
| 2026.04.15 | questions_mun.json | 게임 전체 크래시 | 최상위가 배열 형태 |
| 2026.04.15 | questions_dol/namu.json | 구조 불완전 | seed_en, total 키 누락 |

---

*이 파일을 프로젝트에 올려두면 필레몬이 새 채팅에서도 참조합니다.*
*새 버그 발견 시 "자주 발생한 버그 사례" 섹션에 추가해주세요.*
