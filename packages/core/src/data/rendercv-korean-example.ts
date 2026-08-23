import { defaultLocales } from './rendercv-variants';

/**
 * A Korean résumé (이력서 / 자기소개서), shipped so the Korean support has a
 * worked example: a CJK name with its hanja and Latin renderings, a header
 * photo supplied inline as a base64 data URI, Korean section titles, and a
 * self-introduction written as prompt/answer pairs rather than a list.
 *
 * The details are illustrative rather than anyone's real contact information.
 */
export const koreanResume = {
  cv: `cv:
  name: 김윤서
  name_hanja: 金允誓
  name_english: Yunseo Kim
  location: 서울특별시 강서구
  email: yunseo.kim@example.com
  phone: "+82 10-1234-5678"
  date_of_birth: 2000-03-15
  # A photo may be a URL or, as here, an inline base64 data URI.
  photo: data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMzAwIDQwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNlNmViZjEiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxNDgiIHI9IjYyIiBmaWxsPSIjYjdjNGQyIi8+PHBhdGggZD0iTTM4IDQwMGMwLTYyIDUwLTExMiAxMTItMTEyczExMiA1MCAxMTIgMTEyeiIgZmlsbD0iI2I3YzRkMiIvPjwvc3ZnPg==
  sections:
    지원 부문:
      - label: 응시부문
        details: 교육운영 영상편집
      - label: 기관/지역
        details: 연세의료원/신촌
      - label: 파견업체
        details: 인터비즈시스템
    경력사항:
      - company: FR 미디어
        position: 영상편집자
        고용구분: 단기계약
        start_date: 2023-11
        end_date: 2023-12
        highlights:
          - 교육용 영상 편집 및 자막 제작
      - company: 낮은 울타리
        position: 영상편집자
        고용구분: 프리랜서
        start_date: 2023-09
        end_date: 2023-12
        highlights:
          - 홍보 영상 기획부터 편집까지 단독으로 진행
      - company: International Student Fellowship
        position: 한국어 교사
        고용구분: 자원봉사
        start_date: 2023-09
        end_date: 2023-12
        highlights:
          - 유학생을 대상으로 한 주 1회 한국어 수업 진행
    학력사항:
      - institution: British Columbia Institute of Technology
        area: Digital Design and Development
        degree: 전문학사
        location: British Columbia, Canada
        start_date: 2021-09
        end_date: 2023-05
        highlights:
          - 2년제 졸업
    외국어:
      - label: 영어
        details: IELTS 7.0 (2020/07)
    자기소개서:
      본인을 나타내는 단어 3가지:
        - 성실함
        - 열정
        - 적응력
      지원 동기: >-
        미디어를 통해 사람들에게 도움이 되는 이야기를 전하고 싶어 영상 디자인을
        공부했습니다. 의료원에서 교육용 영상을 만든다면 환자와 보호자가 꼭 알아야 할
        정보를 더 쉽게 전달할 수 있다고 생각합니다. 배운 편집 기술을 사람을 돌보는
        일에 쓰고 싶어 지원했습니다.
      장점과 단점: >-
        한번 맡은 일은 끝까지 꼼꼼하게 마무리하는 것이 장점입니다. 여러 나라를 옮겨
        다니며 자란 덕분에 새로운 환경에도 빠르게 적응합니다. 반면 여러 사람 앞에서
        발표할 때 긴장하는 편이었지만, 대학에서 팀 프로젝트 발표를 반복하며 많이
        나아졌습니다.
      가장 어려웠던 경험과 극복 방안: >-
        영어가 익숙하지 않은 상태로 캐나다에서 대학을 다니며 과제와 에세이를 감당하기
        어려웠습니다. 수업 외 시간을 늘려 부족한 부분을 채우고, 유학생 친구들과 꾸준히
        대화하며 표현을 익혔습니다. 한 학기가 지나자 발표와 보고서 모두 자신 있게
        해낼 수 있었습니다.
      갈등 해결 경험: >-
        대학 팀 프로젝트에서 디자인 방향을 두고 다른 디자이너와 의견이 갈렸습니다.
        각자의 기준을 설명하는 자리를 먼저 만들자고 제안했고, 사용자 관점에서 무엇이
        더 읽기 쉬운지를 기준으로 정리했습니다. 서로의 강점을 살린 시안으로
        마무리했고 프로젝트는 예정대로 끝났습니다.
`,
  design: `design:
  theme: classic
  page:
    size: a4
  header:
    photo_width: 3cm
    photo_position: right
  entries:
    degree_width: 1.6cm
`,
  locale: defaultLocales.korean,
  settings: `settings:
  current_date: today
  bold_keywords: []
  pdf_title: NAME - CV
`
};
