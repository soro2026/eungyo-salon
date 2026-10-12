#!/usr/bin/env python3
# ================================================================
#  EG유니버스 · 효성CMS 시험 도구 (서버판)  v1.1  (2026-10-12 · 파이스)
#  v1.1 — [A] 계좌 회원 직접 등록 · 계좌 · 생년월일은 화면 · 기록에서 가림
#  네이버 클라우드 eg-hyosung(고정 IP 211.233.214.68)에서 돌립니다.
#  시험 서버 전용 — 운영 서버 주소는 이 파일에 없습니다.
#  열쇠는 이 파일에 없습니다. 처음 열 때 한 번 넣으면
#  서버 안 ~/.eg_hyosung/keys.json (권한 600)에만 둡니다.
#  실행: python3 eg_hyosung_test.py
# ================================================================

import datetime
import getpass
import json
import os
import random
import sys
import urllib.error
import urllib.request

VERSION = 'v1.1 · 2026-10-12'
HOST_API = 'https://api-test.hyosungcms.co.kr'
HOST_VIEW = 'https://view-test.hyosungcms.co.kr'
OUR_IP = '211.233.214.68'          # 효성에 등록한 고정 IP (1012 등록 완료)

HOME = os.path.expanduser('~/.eg_hyosung')
KEY_FILE = os.path.join(HOME, 'keys.json')
STATE_FILE = os.path.join(HOME, 'state.json')
LOG_FILE = os.path.join(HOME, '효성시험_기록.txt')

K = {}
S = {}

# ---------------------------------------------------------------- 말하기 · 기록
C = {'g': '\033[32m', 'r': '\033[31m', 'y': '\033[33m', 'c': '\033[36m', 'd': '\033[90m', 'w': '\033[97m', '0': '\033[0m'}


def say(text='', color=None):
    print((C[color] + text + C['0']) if color else text, flush=True)


def line():
    say('-' * 60, 'd')


def log(text):
    stamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(f'[{stamp}] {text}\n')
    except OSError:
        pass


def ask(label, default=''):
    tail = f' (엔터 = {default})' if default else ''
    v = input(f'   {label}{tail}: ').strip()
    return v or default


# ---------------------------------------------------------------- 열쇠
def ask_keys():
    line()
    say('시험 열쇠 셋을 넣습니다. 효성 메일의 「API 테스트용 인증정보」입니다. (처음 한 번만)', 'y')
    cust = ask('업체 ID', 'sdsitest')
    say('   아래 두 칸은 붙여 넣어도 글자가 보이지 않습니다. 붙여 넣고 엔터만 누르세요.', 'd')
    sw = getpass.getpass('   SW_KEY: ').strip()
    ck = getpass.getpass('   CUST_KEY: ').strip()
    if not sw or not ck:
        say('   빈칸이 있습니다. 8번 「열쇠 다시 넣기」로 다시 넣어 주세요.', 'r')
    os.makedirs(HOME, mode=0o700, exist_ok=True)
    fd = os.open(KEY_FILE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        json.dump({'custId': cust, 'swKey': sw, 'custKey': ck}, f)
    os.chmod(KEY_FILE, 0o600)
    say('   열쇠를 이 서버 안 파일에만 넣어 두었습니다(주인만 읽기).', 'g')


def load_keys():
    if not os.path.exists(KEY_FILE):
        ask_keys()
    with open(KEY_FILE, encoding='utf-8') as f:
        return json.load(f)


# ---------------------------------------------------------------- 지난번 값
def load_state():
    st = {'memberId': '', 'agreementId': '', 'shortUrl': '', 'transactions': []}
    try:
        with open(STATE_FILE, encoding='utf-8') as f:
            st.update(json.load(f))
    except (OSError, ValueError):
        pass
    return st


def save_state():
    try:
        with open(STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump(S, f, ensure_ascii=False, indent=1)
    except OSError:
        pass


# ---------------------------------------------------------------- IP
def my_ip():
    for u in ('https://api.ipify.org', 'https://icanhazip.com', 'https://ifconfig.me/ip'):
        try:
            with urllib.request.urlopen(u, timeout=8) as r:
                return r.read().decode().strip()
        except Exception:
            continue
    return None


def check_ip():
    say('이 서버가 밖으로 나갈 때 쓰는 IP를 확인합니다...', 'c')
    ip = my_ip()
    if ip == OUR_IP:
        say(f'   {ip} — 효성에 등록한 고정 IP입니다. 그대로 갑니다.', 'g')
    elif ip:
        say(f'   {ip} — 등록한 {OUR_IP}와 다릅니다. 막히면 이 숫자를 파이스께 알려 주세요.', 'y')
    else:
        say('   IP를 확인하지 못했습니다. 그래도 두드려 봅니다.', 'y')
    log(f'IP 확인 {ip}')


# ---------------------------------------------------------------- 효성 두드리기
SECRET_FIELDS = ('paymentNumber', 'payerNumber', 'password')


def masked(body):
    if not isinstance(body, dict):
        return body
    out = {}
    for k, v in body.items():
        if k in SECRET_FIELDS and v:
            v = str(v)
            out[k] = '*' * max(len(v) - 4, 0) + v[-4:] if k == 'paymentNumber' else '*' * len(v)
        else:
            out[k] = v
    return out


def call(method, url, body=None):
    data = None
    sent = ''
    headers = {
        'Authorization': f"VAN {K['swKey']}:{K['custKey']}",
        'Accept': 'application/json',
    }
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode('utf-8')
        sent = json.dumps(masked(body), ensure_ascii=False)
        headers['Content-Type'] = 'application/json; charset=utf-8'
    log(f'-> {method} {url}')
    if sent:
        log(f'   보낸 것 {sent}')
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    status, text = 0, ''
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            status = r.status
            text = r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        status = e.code
        try:
            text = e.read().decode('utf-8', 'replace')
        except Exception:
            text = str(e)
    except urllib.error.URLError as e:
        text = f'닿지 못함: {e.reason}'
    except Exception as e:
        text = f'뜻밖의 오류: {e}'
    log(f'<- {status} {text}')
    try:
        js = json.loads(text) if text else None
    except ValueError:
        js = None
    return {'status': status, 'text': text, 'json': js, 'sent': sent, 'url': url, 'method': method}


def find(o, name):
    if isinstance(o, dict):
        if name in o and not isinstance(o[name], (dict, list)):
            return o[name]
        for v in o.values():
            got = find(v, name)
            if got is not None:
                return got
    elif isinstance(o, list):
        for v in o:
            got = find(v, name)
            if got is not None:
                return got
    return None


def show(res, title):
    ok = 200 <= res['status'] < 300
    line()
    say(f"   [{'통과' if ok else '막힘'}] {title}  (효성 응답 {res['status']})", 'g' if ok else 'r')
    body = json.dumps(res['json'], ensure_ascii=False, indent=2) if res['json'] is not None else res['text']
    say('')
    say('====== 파이스께 — 여기부터 「끝」까지 긁어 붙여 주세요 ======', 'y')
    say(f"[{title}] {res['method']} {res['url']}")
    if res['sent']:
        say(f"보낸 것: {res['sent']}")
    say(f"응답 {res['status']}:")
    say(body)
    say('====== 끝 ======', 'y')
    return ok


def api(path):
    return f"{HOST_API}/v1/custs/{K['custId']}{path}"


def new_tid():
    return 'T' + datetime.datetime.now().strftime('%Y%m%d%H%M%S') + str(random.randint(100, 999))


def remember_tx(kind, tid, mid, date, amount):
    S['transactions'].append({'kind': kind, 'id': tid, 'memberId': mid, 'date': date,
                              'amount': amount, 'at': datetime.datetime.now().strftime('%m-%d %H:%M')})
    save_state()


def pick_tx(kind):
    lst = [t for t in S.get('transactions', []) if t.get('kind', 'cms') == kind][-5:]
    if not lst:
        return None
    for i, t in enumerate(lst, 1):
        say(f"   {i}  {t['id']}  {t.get('date', '')}  {t['amount']}원  (신청 {t['at']})", 'w')
    n = ask('몇 번을 볼까요', str(len(lst)))
    if not n.isdigit() or not 1 <= int(n) <= len(lst):
        say('   목록의 번호로 넣어 주세요.', 'r')
        return None
    return lst[int(n) - 1]


# ---------------------------------------------------------------- [1] 간편동의 링크
def step_agreement():
    line()
    say('[1] 간편동의 링크 만들기 — 손님이 폰으로 여는 그 화면입니다.', 'c')
    mid = 'EGT' + datetime.datetime.now().strftime('%m%d%H%M%S')
    name = ask('손님 이름', '조신영')
    day = datetime.date.today().day
    if day >= 25:
        day = 1
    body = {
        'memberId': mid,
        'memberName': name,
        'paymentKind': 'CMS,CARD',
        'defaultAmount': 30030,
        'paymentDay': day,
        'receiptFlag': 'N',
    }
    res = call('POST', f"{HOST_VIEW}/api/simple-agreement?custId={K['custId']}", body)
    if not show(res, '간편동의 링크 만들기'):
        return
    aid = find(res['json'], 'agreementSimpleId')
    short = find(res['json'], 'shortenUrl')
    S['memberId'] = mid
    if aid:
        S['agreementId'] = str(aid)
    if short:
        S['shortUrl'] = str(short)
    save_state()
    say('')
    say(f'   회원 번호      {mid}', 'w')
    say(f'   간편동의 번호  {aid}', 'w')
    say(f'   링크           {short}', 'w')
    say('   이 링크를 휴대폰에서 열어 본인인증 · 결제수단 · 서명을 끝까지 가 보세요.', 'y')
    say('   끝나면 [2]로 상태를 봅니다.', 'y')


# ---------------------------------------------------------------- [2] 간편동의 상태
def step_agreement_status():
    line()
    say('[2] 간편동의 상태 보기', 'c')
    aid = ask('간편동의 번호', S.get('agreementId', ''))
    if not aid:
        say('   간편동의 번호가 없습니다. [1]부터 해 주세요.', 'r')
        return
    res = call('GET', f"{HOST_VIEW}/api/simple-agreement/{aid}?custId={K['custId']}")
    show(res, '간편동의 상태 보기')


# ---------------------------------------------------------------- [3] 회원 보기
def step_member():
    line()
    say('[3] 효성에 회원이 섰는지 보기 — 배치 회원은 다음 날 선다고 합니다.', 'c')
    mid = ask('회원 번호', S.get('memberId', ''))
    if not mid:
        say('   회원 번호가 없습니다. [1]부터 해 주세요.', 'r')
        return
    res = call('GET', api(f'/members/{mid}'))
    show(res, '회원 보기')


# ---------------------------------------------------------------- [4] 배치 출금 신청
def step_cms_payment():
    line()
    say('[4] 배치 출금 신청 — 계좌로 동의한 회원', 'c')
    mid = ask('회원 번호', S.get('memberId', ''))
    if not mid:
        say('   회원 번호가 없습니다. [1]부터 해 주세요.', 'r')
        return
    d = datetime.date.today() + datetime.timedelta(days=1)
    while d.weekday() != 5:
        d += datetime.timedelta(days=1)
    sat = d.strftime('%Y%m%d')
    say('   출금일을 여덟 자리로 넣어 주세요. (예: 20261015)', 'd')
    say(f'   주말 · 공휴일을 넣으면 효성이 거절하는지, 다음 영업일로 미는지 보입니다. 엔터 = {sat} (토요일)', 'd')
    say('   마감은 출금일 전 영업일 17시입니다.', 'd')
    date = ask('출금일', sat)
    if not (len(date) == 8 and date.isdigit()):
        say('   여덟 자리 숫자로 넣어 주세요.', 'r')
        return
    amt = ask('금액', '30030')
    if not amt.isdigit():
        say('   금액은 숫자로만 넣어 주세요.', 'r')
        return
    tid = new_tid()
    body = {'transactionId': tid, 'memberId': mid, 'paymentDate': date, 'callAmount': int(amt)}
    res = call('POST', api('/payments/cms'), body)
    if show(res, f'배치 출금 신청 · 출금일 {date}'):
        remember_tx('cms', tid, mid, date, int(amt))
        say(f'   거래 번호 {tid} 를 적어 두었습니다. 결과는 출금일 다음 영업일에 [5]로 봅니다.', 'y')


# ---------------------------------------------------------------- [5] 배치 출금 결과
def step_cms_result():
    line()
    say('[5] 배치 출금 결과 보기', 'c')
    t = pick_tx('cms')
    if not t:
        say('   적어 둔 배치 출금 건이 없습니다. [4]부터 해 주세요.', 'r')
        return
    res = call('GET', api(f"/payments/cms/{t['id']}"))
    show(res, f"배치 출금 결과 · {t['id']}")


# ---------------------------------------------------------------- [6] 카드 승인
def step_card():
    line()
    say('[6] 카드 승인 — 간편동의에서 카드를 고른 회원 · 응답에 수수료(fee)가 바로 옵니다.', 'c')
    mid = ask('회원 번호', S.get('memberId', ''))
    if not mid:
        say('   회원 번호가 없습니다. [1]부터 해 주세요.', 'r')
        return
    amt = ask('금액', '30030')
    if not amt.isdigit():
        say('   금액은 숫자로만 넣어 주세요.', 'r')
        return
    vat = int(amt) // 11
    tid = new_tid()
    body = {'transactionId': tid, 'memberId': mid, 'callAmount': int(amt), 'vatAmount': vat}
    res = call('POST', api('/payments/card'), body)
    if show(res, f'카드 승인 · {amt}원 (부가세 {vat})'):
        remember_tx('card', tid, mid, '', int(amt))
        say(f'   거래 번호 {tid} 를 적어 두었습니다. 시험이 끝나면 [7]로 취소합니다.', 'y')


# ---------------------------------------------------------------- [7] 카드 승인 취소
def step_card_cancel():
    line()
    say('[7] 카드 승인 취소', 'c')
    t = pick_tx('card')
    if not t:
        say('   적어 둔 카드 승인 건이 없습니다. [6]부터 해 주세요.', 'r')
        return
    res = call('POST', api(f"/payments/card/{t['id']}/cancel"))
    show(res, f"카드 승인 취소 · {t['id']}")


# ---------------------------------------------------------------- [A] 계좌 회원 직접 등록
BANKS = [('004', '국민'), ('011', '농협'), ('088', '신한'), ('020', '우리'), ('081', '하나'),
         ('003', '기업'), ('090', '카카오'), ('092', '토스'), ('089', '케이'), ('071', '우체국')]


def step_cms_member():
    line()
    say('[A] 계좌 회원 직접 등록 — 링크 화면을 거치지 않고 서버가 효성에 청합니다.', 'c')
    say('   배치 회원은 다음 날 선다고 합니다. 내일 [3]으로 섰는지 봅니다.', 'd')
    say('   은행 번호 — ' + ' · '.join(f'{c} {n}' for c, n in BANKS), 'd')
    bank = ask('은행 번호 세 자리', '011')
    if not (len(bank) == 3 and bank.isdigit()):
        say('   은행 번호는 세 자리 숫자로 넣어 주세요.', 'r')
        return
    acct = ask('계좌번호 (숫자만 · 화면 · 기록에는 뒤 넷만 남습니다)').replace('-', '').replace(' ', '')
    if not acct.isdigit():
        say('   계좌번호는 숫자로만 넣어 주세요.', 'r')
        return
    holder = ask('예금주 이름', '조신영')
    birth = ask('예금주 생년월일 여섯 자리 (예: 700101 · 화면 · 기록에서 가립니다)')
    if not (len(birth) == 6 and birth.isdigit()):
        say('   생년월일은 여섯 자리 숫자로 넣어 주세요.', 'r')
        return
    phone = ask('휴대폰 번호 (숫자만 · 없으면 엔터)').replace('-', '')
    mid = 'EGC' + datetime.datetime.now().strftime('%m%d%H%M%S')
    day = datetime.date.today().day
    if day >= 25:
        day = 1
    body = {
        'memberId': mid,
        'memberName': holder,
        'paymentKind': 'CMS',
        'paymentCompany': bank,
        'paymentNumber': acct,
        'payerName': holder,
        'payerNumber': birth,
        'defaultAmount': 30030,
        'paymentDay': day,
    }
    if phone:
        body['phone'] = phone
    res = call('POST', api('/members'), body)
    if show(res, '계좌 회원 직접 등록'):
        S['memberId'] = mid
        save_state()
        say(f'   회원 번호 {mid} 를 적어 두었습니다. [3] · [4]가 이 번호로 이어집니다.', 'y')


# ---------------------------------------------------------------- [0] 직접 두드리기
def step_raw():
    line()
    say('[0] 직접 두드리기 — 파이스가 알려 드린 주소를 그대로 넣는 칸입니다.', 'c')
    which = ask('어느 문 (api / view)', 'api')
    host = HOST_VIEW if which.lower().startswith('v') else HOST_API
    method = ask('방식 (GET / POST / PUT / DELETE)', 'GET').upper()
    path = ask('주소 뒷부분 (예: /v1/custs/sdsitest/members/EGT...)')
    if not path.startswith('/'):
        path = '/' + path
    raw = ask('보낼 JSON 한 줄 (없으면 엔터)')
    body = None
    if raw:
        try:
            body = json.loads(raw)
        except ValueError:
            say('   JSON 꼴이 아닙니다. 파이스가 드린 한 줄을 그대로 붙여 주세요.', 'r')
            return
    res = call(method, host + path, body)
    show(res, f'직접 · {method} {path}')


# ---------------------------------------------------------------- 시작
MENU = [
    ('1', '간편동의 링크 만들기', step_agreement),
    ('2', '간편동의 상태 보기', step_agreement_status),
    ('3', '회원 보기', step_member),
    ('4', '배치 출금 신청', step_cms_payment),
    ('5', '배치 출금 결과 보기', step_cms_result),
    ('6', '카드 승인', step_card),
    ('7', '카드 승인 취소', step_card_cancel),
    ('A', '계좌 회원 직접 등록', step_cms_member),
    ('0', '직접 두드리기', step_raw),
]


def main():
    global K, S
    os.makedirs(HOME, mode=0o700, exist_ok=True)
    say(f'EG유니버스 · 효성CMS 시험 도구 (서버판 {VERSION})', 'c')
    say('시험 서버 전용입니다. 운영 서버 주소는 이 도구에 없습니다.', 'd')
    check_ip()
    K = load_keys()
    S = load_state()
    while True:
        line()
        say('무엇을 할까요?', 'c')
        for n, label, _ in MENU:
            say(f'   {n}  {label}')
        say('   8  열쇠 다시 넣기')
        say('   9  마치기')
        c = input('번호: ').strip()
        if c == '9':
            break
        if c == '8':
            ask_keys()
            K = load_keys()
            continue
        fn = next((f for n, _, f in MENU if n == c.upper()), None)
        if not fn:
            say('   목록의 번호를 눌러 주세요.', 'd')
            continue
        try:
            fn()
        except Exception as e:
            say(f'   뜻밖의 오류가 났습니다: {e}', 'r')
            log(f'도구 오류: {e}')
    say('')
    say(f'수고하셨습니다. 오늘 두드린 기록은 {LOG_FILE} 에 남아 있습니다.', 'g')


if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print()
        say('도구를 닫았습니다.', 'd')
        sys.exit(0)
