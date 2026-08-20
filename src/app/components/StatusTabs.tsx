interface StatusTab {
  label: string;
  value: string;
  count: number;
}

interface StatusTabsProps {
  tabs: StatusTab[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function StatusTabs({ tabs, activeTab, onTabChange }: StatusTabsProps) {
  return (
    <div>
      {/* Tab Buttons */}
      <div style={{
        display: 'flex',
        gap: '32px',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            style={{
              position: 'relative',
              padding: '16px 4px',
              border: 'none',
              backgroundColor: 'transparent',
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-weight-medium)',
              color: activeTab === tab.value ? '#7C3AED' : 'var(--color-muted-foreground)',
              cursor: 'pointer',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.value) {
                e.currentTarget.style.color = 'var(--color-foreground)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.value) {
                e.currentTarget.style.color = 'var(--color-muted-foreground)';
              }
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-weight-normal)',
            }}>
              ({tab.count})
            </span>
            
            {/* Active indicator */}
            {activeTab === tab.value && (
              <div style={{
                position: 'absolute',
                bottom: '-1px',
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: '#7C3AED',
              }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}