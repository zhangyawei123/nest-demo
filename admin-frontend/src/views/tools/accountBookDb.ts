import Dexie, { type Table } from 'dexie'

export interface Account {
  id?: number
  name: string
  type: string
  initialBalance: number
  createdAt: Date
}

export interface Category {
  id?: number
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
}

export interface Transaction {
  id?: number
  accountId: number
  categoryId: number
  amount: number
  type: 'income' | 'expense'
  note: string
  occurredAt: Date
  createdAt: Date
}

class AccountBookDb extends Dexie {
  accounts!: Table<Account, number>
  categories!: Table<Category, number>
  transactions!: Table<Transaction, number>

  constructor() {
    super('AccountBookDB')
    this.version(1).stores({
      accounts: '++id, name, createdAt',
      categories: '++id, name, type',
      transactions: '++id, accountId, categoryId, type, occurredAt',
    })

    this.on('populate', async () => {
      const now = new Date()
      await this.accounts.bulkAdd([
        { name: '现金', type: '现金', initialBalance: 0, createdAt: now },
        { name: '支付宝', type: '电子钱包', initialBalance: 0, createdAt: now },
        { name: '工商银行', type: '银行卡', initialBalance: 0, createdAt: now },
      ])
      await this.categories.bulkAdd([
        { name: '餐饮', type: 'expense', icon: '🍱', color: '#ff7875' },
        { name: '交通', type: 'expense', icon: '🚗', color: '#ffa940' },
        { name: '购物', type: 'expense', icon: '🛒', color: '#36cfc9' },
        { name: '居住', type: 'expense', icon: '🏠', color: '#9254de' },
        { name: '娱乐', type: 'expense', icon: '🎮', color: '#597ef7' },
        { name: '工资', type: 'income', icon: '💰', color: '#52c41a' },
        { name: '奖金', type: 'income', icon: '🎁', color: '#13c2c2' },
        { name: '其他', type: 'income', icon: '✨', color: '#faad14' },
      ])
    })
  }

  async clearAll() {
    await this.transaction('rw', this.accounts, this.categories, this.transactions, async () => {
      await this.transactions.clear()
      await this.categories.clear()
      await this.accounts.clear()
    })
  }
}

export const db = new AccountBookDb()
