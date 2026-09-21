import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TouchableOpacity, Text, AccessibilityInfo } from 'react-native';
import { TripStartModal } from './TripStartModal';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('TripStartModal (UX Item 4: Explorar e registrar viagem)', () => {
  const defaultProps = {
    visible: true,
    routeName: 'Trilha do Pindobal',
    isStarting: false,
    isSuccess: false,
    onConfirmStart: jest.fn(),
    onCancel: jest.fn(),
    onGoToHistory: jest.fn(),
    onContinueExploring: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders modal with clear explanation distinguishing exploration, tracking, and recording', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(<TripStartModal {...defaultProps} />);
    });

    const textNodes = root.root.findAllByType(Text);
    const titleNode = textNodes.find(
      (n) => n.props.accessibilityRole === 'header' && n.props.children === 'Registrar Início da Viagem'
    );
    expect(titleNode).toBeDefined();

    const featureTitles = textNodes.filter(
      (h) => h.props.children === 'O que é registrado' || h.props.children === 'Exploração e Mapa' || h.props.children === 'Como encerrar'
    );
    expect(featureTitles.length).toBe(3);

    const buttons = root.root.findAllByType(TouchableOpacity);
    const confirmBtn = buttons.find(
      (node) => node.props.accessibilityLabel === 'Confirmar e iniciar viagem'
    );
    expect(confirmBtn).toBeDefined();

    act(() => {
      confirmBtn?.props.onPress();
    });
    expect(defaultProps.onConfirmStart).toHaveBeenCalledTimes(1);
  });

  it('triggers onCancel when Cancel button is pressed', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(<TripStartModal {...defaultProps} />);
    });

    const buttons = root.root.findAllByType(TouchableOpacity);
    const cancelBtn = buttons.find(
      (node) => node.props.accessibilityLabel === 'Cancelar'
    );
    expect(cancelBtn).toBeDefined();

    act(() => {
      cancelBtn?.props.onPress();
    });
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders success state with action buttons to view history or continue exploring', () => {
    let root!: renderer.ReactTestRenderer;
    act(() => {
      root = renderer.create(<TripStartModal {...defaultProps} isSuccess={true} />);
    });

    const textNodes = root.root.findAllByType(Text);
    const successTitleNode = textNodes.find(
      (n) => n.props.accessibilityRole === 'header' && n.props.children === 'Viagem Registrada!'
    );
    expect(successTitleNode).toBeDefined();

    const buttons = root.root.findAllByType(TouchableOpacity);
    const historyBtn = buttons.find(
      (node) => node.props.accessibilityLabel === 'Ver no Histórico de Viagens'
    );
    expect(historyBtn).toBeDefined();

    act(() => {
      historyBtn?.props.onPress();
    });
    expect(defaultProps.onGoToHistory).toHaveBeenCalledTimes(1);

    const exploreBtn = buttons.find(
      (node) => node.props.accessibilityLabel === 'Continuar explorando a rota'
    );
    expect(exploreBtn).toBeDefined();

    act(() => {
      exploreBtn?.props.onPress();
    });
    expect(defaultProps.onContinueExploring).toHaveBeenCalledTimes(1);
  });
});
