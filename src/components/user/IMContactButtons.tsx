'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SOCIAL_CONTACT_TYPES, getSocialContactTypeById, openSocialChat } from '@/services/socialContactService';

interface IMContact {
  type: string;
  value: string;
}

interface IMContactButtonsProps {
  contacts: IMContact[];
  isContact: boolean;
  onRequestContact?: () => void;
  size?: 'sm' | 'md';
  showRequestButton?: boolean;
}

/**
 * IM联系方式按钮组件
 * 设计风格：参考Header顶部社交图标布局
 */
export default function IMContactButtons({
  contacts,
  isContact,
  onRequestContact,
  size = 'md',
  showRequestButton = true
}: IMContactButtonsProps) {
  const t = useTranslations('messages');
  
  if (!contacts || contacts.length === 0) {
    return null;
  }

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-2 ml-auto">
      {/* IM工具按钮 - 参考Header社交图标布局 */}
      <div className="flex items-center gap-2">
        {contacts.map((contact, index) => {
          const contactType = getSocialContactTypeById(contact.type);
          if (!contactType) return null;

          return (
            <React.Fragment key={contact.type}>
              {/* 图标按钮 */}
              {isContact ? (
                // 是联系人：可点击直接聊天
                <button
                  onClick={() => openSocialChat(contact.type, contact.value)}
                  className="transition-transform hover:scale-110"
                  style={{ color: contactType.color }}
                  title={`${contactType.displayName}: ${contact.value}`}
                >
                  <span className={iconSize} style={{ display: 'block' }}>
                    {contactType.iconSvg}
                  </span>
                </button>
              ) : (
                // 非联系人：灰色图标
                <button
                  onClick={onRequestContact}
                  className="text-gray-400 hover:text-gray-600 transition-all"
                  title={`${contactType.displayName} - 点击申请联系`}
                >
                  <span className={iconSize} style={{ display: 'block', opacity: 0.6 }}>
                    {contactType.iconSvg}
                  </span>
                </button>
              )}
              
              {/* 分隔线（最后一项不显示） */}
              {index < contacts.length - 1 && (
                <span className="text-gray-300 text-xs">|</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 申请按钮（非联系人时显示） */}
      {!isContact && showRequestButton && onRequestContact && (
        <>
          <span className="text-gray-300 text-xs">|</span>
          <button
            onClick={onRequestContact}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Users className="w-4 h-4" />
            {t('exchangeContactInfo')}
          </button>
        </>
      )}
    </div>
  );
}
