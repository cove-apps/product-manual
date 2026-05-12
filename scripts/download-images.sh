#!/bin/bash
# 批量下载飞书文档截图
# 用法: bash scripts/download-images.sh
# 先 cd 到目标目录再执行

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

download_client() {
  echo "=== 下载客户端手册截图 ==="
  cd "$SCRIPT_DIR/products/cove/client/images"

  # 安装与登录
  lark-cli docs +media-download --token "O6labVVGHo1InAxejSEczLSTnXe" --output "安装-在线安装.png" --overwrite
  lark-cli docs +media-download --token "ARO8byMPfoCN83x7OgvclsMKnOf" --output "登录-注册登录界面.png" --overwrite

  # 界面速览
  lark-cli docs +media-download --token "N1GVbSt4bo9hfKxsGQDcLeOdn4e" --output "界面-插件主界面.png" --overwrite
  lark-cli docs +media-download --token "BY4SbjkXyoiClwxgSZscWpmjnBg" --output "界面-任务类型按钮.png" --overwrite
  lark-cli docs +media-download --token "ELaYbsWeWon7D4xFCeMc8n23nAd" --output "界面-快捷指令按钮.png" --overwrite
  lark-cli docs +media-download --token "Vs3fbi5FsoVrR8xFBS0cQqsgnfc" --output "界面-自然对话窗口.png" --overwrite
  lark-cli docs +media-download --token "Uss9biy4Kom1Ooxdca4cAv0Fnmd" --output "界面-模型选择按钮.png" --overwrite
  lark-cli docs +media-download --token "Ya7BbAtPso7aiuxPH58cy96in9e" --output "界面-更多操作按钮.png" --overwrite
  lark-cli docs +media-download --token "Hj1SblJFpo9ju9xZn1tcGwsbnhf" --output "界面-开启新对话.png" --overwrite

  # 校对
  lark-cli docs +media-download --token "DgzcbyAjNogN09xqbOYc6E2AnXd" --output "校对-操作前.png" --overwrite
  lark-cli docs +media-download --token "IlDdbezZXoJl0Kx6emxcuU2Znbh" --output "校对-结果弹窗.png" --overwrite

  # 排版
  lark-cli docs +media-download --token "M3Frb7jABo96oOxiW1HcjnbUnEe" --output "排版-操作前.png" --overwrite
  lark-cli docs +media-download --token "AZsYbZQiooZ46xveUmXcUkQDnmh" --output "排版-效果确认.png" --overwrite

  # 校审
  lark-cli docs +media-download --token "Qx70bktrSoZQE5xgDB9cKNPFnFe" --output "校审-合同审查.png" --overwrite
  lark-cli docs +media-download --token "Fszxbj9k9oWVRlxq8y5c1BI4nbg" --output "校审-批注结果.png" --overwrite

  # 翻译
  lark-cli docs +media-download --token "LZa7b4k6vot6FyxSsENcMrG2nKe" --output "翻译-选择指令.png" --overwrite
  lark-cli docs +media-download --token "MtaRbjiRKob9TRxMbzUcKX2jnu2" --output "翻译-对照结果.png" --overwrite

  # 总结
  lark-cli docs +media-download --token "Mu11bm5IMoMzIZxOpOic1ONWndc" --output "总结-智能提炼.png" --overwrite
  lark-cli docs +media-download --token "VugQbCoSbolWNDxap8Jc4nV5nUe" --output "总结-提炼结果.png" --overwrite
  lark-cli docs +media-download --token "V0tNb9ioKom0iRxRvWncFrMsnlf" --output "总结-会议纪要.png" --overwrite
  lark-cli docs +media-download --token "FOKdbpgDjoGZKIx4EGAcILvjnDy" --output "总结-纪要结果.png" --overwrite
  lark-cli docs +media-download --token "WcyNbLYYroYx6xxHyXXcJ7pxnKd" --output "总结-周报助手.png" --overwrite
  lark-cli docs +media-download --token "HNbUbb3C2oVGn8xQehWcCdyvnLf" --output "总结-周报结果.png" --overwrite

  # 改写
  lark-cli docs +media-download --token "Nfv9biO51ooU7QxHwOwcrnlOnWg" --output "改写-示例原文.png" --overwrite
  lark-cli docs +media-download --token "TVDVbvYAtoZ0JDxutnfczloHne2" --output "改写-续写.png" --overwrite
  lark-cli docs +media-download --token "UdA8b71DQoEthsxRO6GcgwpInXo" --output "改写-缩写.png" --overwrite
  lark-cli docs +media-download --token "AYS2bayiZoseJTxAG9vctq1VnCc" --output "改写-扩写.png" --overwrite
  lark-cli docs +media-download --token "BZ0vbmBzmoVSSBx9yy0cGoOOnff" --output "改写-重写.png" --overwrite

  # 润色
  lark-cli docs +media-download --token "DFh6bDfljoWyOox8TZQcFwfOnJb" --output "润色-操作前.png" --overwrite
  lark-cli docs +media-download --token "Pj7UbXZkJoynk2xS7mFcx0VJnLc" --output "润色-润色结果.png" --overwrite

  # 小工具
  lark-cli docs +media-download --token "A04ib0cC8og7IZxwcZxcHUWEnkb" --output "小工具-删除空行.png" --overwrite
  lark-cli docs +media-download --token "HAogbyGW4oc8GRxlhfBcGI9VnPf" --output "小工具-空行已删除.png" --overwrite
  lark-cli docs +media-download --token "XsApbSHnOo3J3ix1WpJcEZA4njh" --output "小工具-表格对齐.png" --overwrite
  lark-cli docs +media-download --token "YOVXbKY0CofcRaxIyyPcVTSynqb" --output "小工具-表格已对齐.png" --overwrite

  # 常见问题
  lark-cli docs +media-download --token "QbS6bo1l4oMgWmxjDL7c2mhXnKF" --output "常问-安装失败提示.png" --overwrite

  echo "客户端截图下载完成"
}

download_admin() {
  echo "=== 下载服务端手册截图 ==="
  cd "$SCRIPT_DIR/products/cove/admin/images"

  # 部署配置
  lark-cli docs +media-download --token "ZBcVb5PweoAsILxXxKHcikuunle" --output "部署-导入License.png" --overwrite
  lark-cli docs +media-download --token "Ll8HbkucjoxSj5xH30icE42hn0g" --output "部署-模型供应商.png" --overwrite
  lark-cli docs +media-download --token "YMZDbXV2UoYAOJx4qXrcprK3nJf" --output "部署-内网模型配置.png" --overwrite
  lark-cli docs +media-download --token "QvECb2vjpoj6yNxx6y3cGwbMnie" --output "模型-添加模型.png" --overwrite
  lark-cli docs +media-download --token "MxZVbpD5YoLrgSxFoi4cjcObnKc" --output "模型-配置参数.png" --overwrite
  lark-cli docs +media-download --token "NUsYbVNdtohd0FxRwntcvgfBnys" --output "模型-测试连接.png" --overwrite
  lark-cli docs +media-download --token "YsJwbxRu3oVGbzxLV8NcDhuunne" --output "模型-场景配置.png" --overwrite
  lark-cli docs +media-download --token "YYfYbyZJSoO3NNxrBf7cHCIQnph" --output "模型-场景选择.png" --overwrite

  # 版本发布
  lark-cli docs +media-download --token "DKq0bt1JcoLBpxxlEPyc4seNnFc" --output "发布-版本升级界面.png" --overwrite
  lark-cli docs +media-download --token "O7h0bkQg7odlKGxNYfFcMU21nub" --output "发布-安装命令.png" --overwrite
  lark-cli docs +media-download --token "HPrXb03njokVd3xh7kRctkYWnZc" --output "发布-品牌定制.png" --overwrite

  # 用户管理
  lark-cli docs +media-download --token "NDSxbcPpHohi3TxvCxKcgCA4nCc" --output "用户-用户管理首页.png" --overwrite
  lark-cli docs +media-download --token "UqAfbYzrdo40cjxXGiicclRvnnb" --output "用户-注册审批.png" --overwrite
  lark-cli docs +media-download --token "Q6W8bYZ5Aoby1RxRgnNcsQLBnni" --output "用户-自动审批规则.png" --overwrite
  lark-cli docs +media-download --token "Nbxob2w0YodQlOxZVD5cBblcnBf" --output "用户-新增成员.png" --overwrite
  lark-cli docs +media-download --token "GAhVbXI6gouW4zxb6YfcXVnFn8d" --output "用户-部门管理.png" --overwrite
  lark-cli docs +media-download --token "OK1vbvjMZoFgepxM4SPcvnOgnif" --output "用户-成员信息管理.png" --overwrite

  # 任务与指令
  lark-cli docs +media-download --token "OtZkbcBHWoSygRx5SH7czOkhnZg" --output "任务-管理端按钮.png" --overwrite
  lark-cli docs +media-download --token "ZSz9bzifjoBDPXxEE77cqz6GnUe" --output "任务-客户端按钮.png" --overwrite
  lark-cli docs +media-download --token "PPL6bcZIeoh15sxsJnycYWXqnvd" --output "任务-类型管理界面.png" --overwrite
  lark-cli docs +media-download --token "MzpYbLVmRodvzoxkSodcGgoEnpf" --output "任务-编辑任务类型.png" --overwrite
  lark-cli docs +media-download --token "W7xHbcPiJoagwVxq3jcc084hnUf" --output "指令-快捷指令界面.png" --overwrite
  lark-cli docs +media-download --token "CsgYbUdWOohjL9xNPE3cmsHwnDd" --output "指令-编辑快捷指令.png" --overwrite

  # 安全
  lark-cli docs +media-download --token "Xk6pbxxtGooOHBxuMMmcNYsHnzg" --output "安全-操作日志.png" --overwrite
  lark-cli docs +media-download --token "AHUvb9jzrosAiAx2MrschBsjnMH" --output "安全-操作详情.png" --overwrite
  lark-cli docs +media-download --token "LsDJb0qbxoj9cgxOcz6cCK67nTm" --output "安全-DLP配置.png" --overwrite
  lark-cli docs +media-download --token "LyVmbBNEgoY5rQx75uAcOot6nIc" --output "安全-DLP编辑.png" --overwrite

  # 仪表盘
  lark-cli docs +media-download --token "SoBab7wxIolzOuxPll7cd5zPnrg" --output "仪表盘-总览.png" --overwrite
  lark-cli docs +media-download --token "D2Fbb4KD9ooGxaxR2vNcqIkBn18" --output "仪表盘-部门榜单.png" --overwrite

  echo "服务端截图下载完成"
}

# 执行下载
download_client
download_admin
echo "所有截图下载完成！"
