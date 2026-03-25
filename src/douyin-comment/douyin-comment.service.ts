import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DouyinComment } from './douyin-comment.entity';
import * as puppeteer from 'puppeteer-core';

@Injectable()
export class DouyinCommentService {
  constructor(
    @InjectRepository(DouyinComment)
    private commentRepository: Repository<DouyinComment>,
  ) {}

  async getCommentsByUrl(videoUrl: string): Promise<DouyinComment[]> {
    const existing = await this.commentRepository.find({
      where: { videoUrl },
      order: { likeCount: 'DESC' },
    });
    return existing;
  }

  async fetchAndSaveComments(videoUrl: string): Promise<DouyinComment[]> {
    const comments = await this.crawlComments(videoUrl);

    await this.commentRepository.delete({ videoUrl });

    const saved: DouyinComment[] = [];
    for (const c of comments) {
      const entity = this.commentRepository.create({ ...c, videoUrl });
      saved.push(await this.commentRepository.save(entity));
    }
    return saved;
  }

  private async crawlComments(videoUrl: string): Promise<Partial<DouyinComment>[]> {
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // 等待评论区加载
      await page.waitForSelector('[data-e2e="comment-list"]', { timeout: 15000 }).catch(() => {});

      // 滚动加载更多评论
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await new Promise(r => setTimeout(r, 2000));

      const comments = await page.evaluate(() => {
        const items: any[] = [];
        const commentEls = document.querySelectorAll('[data-e2e="comment-list"] [data-e2e="comment-item"]');
        commentEls.forEach(el => {
          const nickname = el.querySelector('[data-e2e="comment-user-nickname"]')?.textContent?.trim() || '';
          const content = el.querySelector('[data-e2e="comment-content"]')?.textContent?.trim() || '';
          const likeText = el.querySelector('[data-e2e="comment-like-count"]')?.textContent?.trim() || '0';
          const avatarUrl = el.querySelector('img[data-e2e="user-avatar"]')?.getAttribute('src') || '';
          const likeCount = parseInt(likeText.replace(/[^0-9]/g, '')) || 0;
          if (content) {
            items.push({ nickname, content, likeCount, avatarUrl });
          }
        });
        return items;
      });

      return comments;
    } finally {
      await browser.close();
    }
  }
}
