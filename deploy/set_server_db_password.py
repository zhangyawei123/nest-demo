from pathlib import Path
import base64
import subprocess
import sys
import textwrap

host = 'root@111.229.210.78'
local_env = Path(__file__).resolve().parents[1] / '.env'

if not local_env.exists():
    print('本地 .env 不存在')
    sys.exit(1)

newpass = ''
for line in local_env.read_text().splitlines():
    if line.startswith('DB_PASSWORD='):
        newpass = line.split('=', 1)[1]
        break

if not newpass:
    print('本地 .env 的 DB_PASSWORD 为空或不存在')
    sys.exit(1)

pwd_b64 = base64.b64encode(newpass.encode()).decode()

remote_script = textwrap.dedent("""
from pathlib import Path
import base64
import subprocess
import sys

pwd_b64 = {pwd_b64!r}
new = base64.b64decode(pwd_b64).decode()
env_path = Path('/opt/nest-demo/.env')
current = ''
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.startswith('DB_PASSWORD='):
            current = line.split('=', 1)[1]
            break

sql = '''
SET @pwd = FROM_BASE64('{pwd_b64}');
SET @sql1 = CONCAT("ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY ", QUOTE(@pwd));
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;
SET @sql2 = CONCAT("ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ", QUOTE(@pwd));
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
FLUSH PRIVILEGES;
'''

def mysql_cmd(password):
    cmd = ['mysql', '-u', 'root']
    if password:
        cmd.append(f'-p{{password}}')
    return cmd

used_password = None
for candidate in [current, '']:
    result = subprocess.run(
        mysql_cmd(candidate) + ['-Nse', 'SELECT 1;'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if result.returncode == 0:
        used_password = candidate
        break

if used_password is None:
    print('服务器端无法使用当前 .env 中的密码或空密码连接 MySQL，请手动检查。')
    sys.exit(1)

subprocess.run(
    mysql_cmd(used_password),
    input=sql.encode(),
    check=True,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)

text = env_path.read_text() if env_path.exists() else ''
lines = []
found = False
for line in text.splitlines():
    if line.startswith('DB_PASSWORD='):
        lines.append(f'DB_PASSWORD={{new}}')
        found = True
    else:
        lines.append(line)
if not found:
    lines.append(f'DB_PASSWORD={{new}}')
env_path.write_text('\\n'.join(lines) + '\\n')

subprocess.run(['pm2', 'restart', 'nest-demo', '--update-env'], check=True)
subprocess.run(mysql_cmd(new) + ['-Nse', 'SELECT 1;'], check=True, stdout=subprocess.DEVNULL)
health = subprocess.run(['curl', '-s', 'http://127.0.0.1:3000/'], check=True, capture_output=True, text=True)
print('SERVER_DB_PASSWORD_UPDATED')
print(health.stdout)
""").format(pwd_b64=repr(pwd_b64))

result = subprocess.run(
    ['ssh', '-tt', '-o', 'StrictHostKeyChecking=no', host, 'python3', '-'],
    input=remote_script.encode(),
)
sys.exit(result.returncode)
