import React from 'react';
import renderer, { act } from 'react-test-renderer';
import * as Linking from 'expo-linking';

import { SignedOutScreen } from './SignedOutScreen';
import { useAuth } from '../../hooks/useAuth';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('SignedOutScreen — Tela de Sessão Encerrada e Opções de Login', () => {
  const mockSignInWithGoogle = jest.fn();
  const mockSignInWithPassword = jest.fn();
  const mockSignUp = jest.fn();
  const mockLinkAccount = jest.fn();
  const mockResetPassword = jest.fn();
  const mockClearGuestFavoritesSnapshot = jest.fn();
  const mockIsIdentityConflictError = jest.fn();
  const mockOnContinueAsGuest = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      signInWithGoogle: mockSignInWithGoogle,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      linkAccount: mockLinkAccount,
      resetPassword: mockResetPassword,
      clearGuestFavoritesSnapshot: mockClearGuestFavoritesSnapshot,
      isIdentityConflictError: mockIsIdentityConflictError,
    });
  });

  test('renderiza os elementos principais de acolhimento e opções', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <SignedOutScreen onContinueAsGuest={mockOnContinueAsGuest} />
      );
    });

    const texts = tree.root.findAllByType('Text' as any).map((n) => n.props.children);
    expect(texts).toContain('Sessão Encerrada');
    expect(texts).toContain('Até logo!');
    expect(texts).toContain('Entrar com o Google');
    expect(texts).toContain('Entrar com E-mail');
    expect(texts).toContain('Continuar como Visitante');
    expect(texts).toContain('Cadastre-se');
  });

  test('aciona callback ao clicar em Continuar como Visitante', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <SignedOutScreen onContinueAsGuest={mockOnContinueAsGuest} />
      );
    });

    const guestBtn = tree.root.findByProps({
      accessibilityLabel: 'Continuar como Visitante',
    });

    await act(async () => {
      guestBtn.props.onPress();
    });

    expect(mockOnContinueAsGuest).toHaveBeenCalledTimes(1);
  });

  test('executa fluxo de login com o Google ao clicar no botão do Google', async () => {
    mockSignInWithGoogle.mockResolvedValue({ url: 'https://auth.google.com/oauth' });

    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <SignedOutScreen onContinueAsGuest={mockOnContinueAsGuest} />
      );
    });

    const googleBtn = tree.root.findByProps({
      accessibilityLabel: 'Entrar com o Google',
    });

    await act(async () => {
      await googleBtn.props.onPress();
    });

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
  });

  test('abre modal de autenticação ao clicar em Entrar com E-mail', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <SignedOutScreen onContinueAsGuest={mockOnContinueAsGuest} />
      );
    });

    const emailBtn = tree.root.findByProps({
      accessibilityLabel: 'Entrar com E-mail e Senha',
    });

    await act(async () => {
      emailBtn.props.onPress();
    });

    // O modal AuthModal deve estar presente na árvore
    const authModal = tree.root.findByProps({
      accessibilityLabel: 'Autenticação e cadastro ECOnexão',
    });
    expect(authModal).toBeDefined();
    expect(authModal.props.visible).toBe(true);
  });

  test('abre modal de cadastro ao clicar em Cadastre-se no rodapé', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <SignedOutScreen onContinueAsGuest={mockOnContinueAsGuest} />
      );
    });

    const signUpBtn = tree.root.findByProps({
      accessibilityLabel: 'Criar conta',
    });

    await act(async () => {
      signUpBtn.props.onPress();
    });

    const authModal = tree.root.findByProps({
      accessibilityLabel: 'Autenticação e cadastro ECOnexão',
    });
    expect(authModal).toBeDefined();
    expect(authModal.props.visible).toBe(true);
  });
});
