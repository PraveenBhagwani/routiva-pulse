export const PULSE_N8N_WEBHOOK_URL = `${
  import.meta.env.VITE_N8N_WEBHOOK_BASE_URL || 'https://praveen5841111.app.n8n.cloud'
}/webhook/routiva-pulse-whatsapp`;

export interface N8nApprovePayload {
  callback_query: {
    data: string;
    message: {
      chat: {
        id: string;
      };
      text: string;
    };
  };
}

export interface N8nScanPayload {
  message: {
    text: string;
    from: string;
  };
}

/**
 * Triggers approval sending via n8n production webhook
 */
export async function triggerN8nApprove(
  customerIdentifier: string,
  ownerChatId: string,
  cleanPhone: string,
  draftMessage: string
): Promise<Response> {
  const payload: N8nApprovePayload = {
    callback_query: {
      data: `a|${customerIdentifier}`,
      message: {
        chat: {
          id: ownerChatId || `91${cleanPhone}`,
        },
        text: `Phone: ${cleanPhone}\nDraft:\n${draftMessage}`,
      },
    },
  };

  return fetch(PULSE_N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Triggers 6-agent AI scan via n8n production webhook
 */
export async function triggerN8nScan(ownerChatId: string): Promise<Response> {
  const payload: N8nScanPayload = {
    message: {
      text: '/scan',
      from: ownerChatId || '',
    },
  };

  return fetch(PULSE_N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
