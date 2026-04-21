Page({
  data: { display: '0', expr: '' },
  current: '0',
  prev: null,
  operator: null,
  resetNext: false,

  onKey(e) {
    const val = e.currentTarget.dataset.val;

    if (val === 'C') {
      this.current = '0'; this.prev = null; this.operator = null; this.resetNext = false;
      this.setData({ display: '0', expr: '' });
      return;
    }

    if (val === '±') {
      this.current = String(-parseFloat(this.current));
      this.setData({ display: this.current });
      return;
    }

    if (val === '%') {
      this.current = String(parseFloat(this.current) / 100);
      this.setData({ display: this.current });
      return;
    }

    if ('+-×÷'.includes(val)) {
      if (this.prev !== null && this.operator && !this.resetNext) {
        this.calculate();
      }
      this.prev = parseFloat(this.current);
      this.operator = val;
      this.resetNext = true;
      this.setData({ expr: `${this.prev} ${val}` });
      return;
    }

    if (val === '=') {
      if (this.prev !== null && this.operator) {
        const expr = `${this.prev} ${this.operator} ${this.current}`;
        this.calculate();
        this.setData({ expr });
        this.prev = null;
        this.operator = null;
      }
      return;
    }

    // 数字和小数点
    if (this.resetNext) {
      this.current = val === '.' ? '0.' : val;
      this.resetNext = false;
    } else {
      if (val === '.' && this.current.includes('.')) return;
      if (this.current === '0' && val !== '.') {
        this.current = val;
      } else {
        this.current += val;
      }
    }
    this.setData({ display: this.current });
  },

  calculate() {
    const a = this.prev;
    const b = parseFloat(this.current);
    let result = 0;
    switch (this.operator) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '×': result = a * b; break;
      case '÷': result = b !== 0 ? a / b : 0; break;
    }
    // 避免浮点精度问题
    this.current = String(Math.round(result * 1e10) / 1e10);
    this.setData({ display: this.current });
    this.resetNext = true;
  },

  onShareAppMessage() {
    return { title: '计算器', path: '/subpackages/tools/calc/calc' };
  }
});
