import type { ThemeConfig } from 'antd';

/**
 * 全站统一的 antd 主题（简洁专业风格）：
 * 一个主色，白色卡片 + 浅灰底，层级靠留白和细边框，不用大面积的色块和重阴影。
 * 颜色集中在这里，页面里尽量不再写死颜色。
 */
export const palette = {
  primary: '#3370ff',
  text: '#1f2329',
  textSecondary: '#646a73',
  textTertiary: '#8f959e',
  border: '#dee0e3',
  borderLight: '#eceef1',
  bgLayout: '#f5f6f7',
  bgSubtle: '#fafbfc',
  warning: '#ff8800',
};

export const theme: ThemeConfig = {
  token: {
    colorPrimary: palette.primary,
    colorInfo: palette.primary,
    colorTextBase: palette.text,
    colorTextSecondary: palette.textSecondary,
    colorTextTertiary: palette.textTertiary,
    colorBorder: palette.border,
    colorBorderSecondary: palette.borderLight,
    colorBgLayout: palette.bgLayout,
    borderRadius: 6,
    borderRadiusLG: 10,
    fontSize: 14,
    controlHeight: 34,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
    boxShadowSecondary: '0 6px 20px rgba(31, 35, 41, 0.08)',
  },
  components: {
    Table: {
      headerBg: palette.bgSubtle,
      headerColor: palette.textSecondary,
      headerSplitColor: 'transparent',
      rowHoverBg: '#f7f9ff',
      borderColor: palette.borderLight,
      cellPaddingBlockSM: 10,
    },
    Menu: {
      itemBorderRadius: 6,
      itemHeight: 38,
      itemSelectedBg: '#e8efff',
      itemSelectedColor: palette.primary,
      itemHoverBg: '#f2f3f5',
      itemMarginInline: 8,
      activeBarBorderWidth: 0,
    },
    Card: {
      headerFontSize: 15,
    },
    Segmented: {
      itemSelectedBg: '#fff',
    },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      fontWeight: 500,
    },
    Tag: {
      defaultBg: '#f2f3f5',
      defaultColor: palette.textSecondary,
    },
  },
};
