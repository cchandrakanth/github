import { render, fireEvent } from '@testing-library/react-native';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { SidePanel } from '@/components/nav/SidePanel';
import { destinations } from '@/components/nav/destinations';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

describe('adaptive navigation components', () => {
  it('bottom tab bar renders all 4 destinations with the active one selected (IT-1 / AC-3.1, AC-3.4)', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(<BottomTabBar activeName="index" onPress={onPress} />);
    for (const d of destinations) expect(getByLabelText(d.title)).toBeTruthy();
    expect(getByLabelText('Notes').props.accessibilityState.selected).toBe(true);
    expect(getByLabelText('Search').props.accessibilityState.selected).toBe(false);
    fireEvent.press(getByLabelText('Search'));
    expect(onPress).toHaveBeenCalledWith('search');
  });

  it('side panel renders the same destinations with active highlight (IT-2 / AC-3.2)', () => {
    const onPress = jest.fn();
    const { getByLabelText, getByTestId } = render(<SidePanel activeName="reminders" onPress={onPress} />);
    expect(getByTestId('side-panel')).toBeTruthy();
    for (const d of destinations) expect(getByLabelText(d.title)).toBeTruthy();
    expect(getByLabelText('Reminders').props.accessibilityState.selected).toBe(true);
    fireEvent.press(getByLabelText('Settings'));
    expect(onPress).toHaveBeenCalledWith('settings');
  });
});

describe('breakpoint switching (IT-3 / AC-3.3)', () => {
  it('useIsWide flips at the 768px breakpoint', () => {
    const rn = require('react-native');
    const { useIsWide, WIDE_BREAKPOINT } = require('@/hooks/useIsWide');
    const spy = jest.spyOn(rn, 'useWindowDimensions');
    const probe = (width: number) => {
      spy.mockReturnValue({ width, height: 800, scale: 2, fontScale: 1 });
      let result: boolean | undefined;
      function Probe() {
        result = useIsWide();
        return null;
      }
      render(<Probe />);
      return result;
    };
    expect(probe(WIDE_BREAKPOINT - 1)).toBe(false);
    expect(probe(WIDE_BREAKPOINT)).toBe(true);
    spy.mockRestore();
  });
});
