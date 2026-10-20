import { Injectable, Logger } from '@nestjs/common';

type OpenRouterChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string }>;
    };
  }>;
};

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly apiKey = process.env.OPENROUTER_API_KEY;
  private readonly model = 'nvidia/nemotron-3.5-lightning:free';
  private readonly endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    if (!this.apiKey) {
      this.logger.warn(
        'OPENROUTER_API_KEY is not set. Booking confirmations will use a fallback message.',
      );
    }
  }

  async generateBookingConfirmation(params: {
    guestName: string;
    date: string;
    startTime: string;
  }): Promise<string> {
    const { guestName, date, startTime } = params;
    const prompt = `Generate a short, friendly, and enthusiastic confirmation message for ${guestName} who just booked a coding mentorship chat on ${date} at ${startTime}. Add a brief nerdy tech icebreaker.`;

    if (!this.apiKey) {
      return this.fallbackMessage(guestName, date, startTime);
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'scheduling-api',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `OpenRouter request failed (${response.status}): ${errorBody}`,
        );
      }

      const payload = (await response.json()) as OpenRouterChatCompletion;
      const content = payload.choices?.[0]?.message?.content;
      const text =
        typeof content === 'string'
          ? content.trim()
          : content?.map((part) => part.text ?? '').join('').trim();

      if (!text) {
        return this.fallbackMessage(guestName, date, startTime);
      }

      return text;
    } catch (error) {
      this.logger.error(
        'OpenRouter confirmation generation failed; using fallback message.',
        error instanceof Error ? error.stack : String(error),
      );
      return this.fallbackMessage(guestName, date, startTime);
    }
  }

  private fallbackMessage(
    guestName: string,
    date: string,
    startTime: string,
  ): string {
    return `You're booked, ${guestName}! See you on ${date} at ${startTime} for a coding mentorship chat. Icebreaker: why do programmers prefer dark mode? Because light attracts bugs.`;
  }
}
