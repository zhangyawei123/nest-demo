import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DouyinHot } from './douyin-hot.entity';

@Injectable()
export class DouyinHotService {
  constructor(
    @InjectRepository(DouyinHot)
    private douyinHotRepository: Repository<DouyinHot>,
  ) {}

  async findAll(): Promise<DouyinHot[]> {
    return this.douyinHotRepository.find({
      order: { rank: 'ASC', createdAt: 'DESC' },
    });
  }

  async fetchAndSaveHotList(): Promise<DouyinHot[]> {
    try {
      const hotList = await this.fetchRealHotList();

      await this.douyinHotRepository.clear();

      const savedItems: DouyinHot[] = [];
      for (const item of hotList) {
        const hotItem = this.douyinHotRepository.create(item);
        const savedItem = await this.douyinHotRepository.save(hotItem as any);
        savedItems.push(savedItem as DouyinHot);
      }

      return savedItems;
    } catch (error) {
      console.error('获取抖音热点榜失败:', error);
      throw error;
    }
  }

  private async fetchRealHotList(): Promise<any[]> {
    const res = await fetch('https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.douyin.com/',
      },
    });

    if (!res.ok) {
      throw new Error(`请求失败: ${res.status}`);
    }

    const json: any = await res.json();
    const wordList: any[] = json?.word_list || [];

    return wordList.map((item: any, index: number) => ({
      rank: index + 1,
      title: item.word,
      hotValue: item.hot_value,
      cover: item.word_cover?.url_list?.[0] || '',
      url: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
    }));
  }
}
