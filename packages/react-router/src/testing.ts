import {
  MockAccessProvider as ReactMockAccessProvider,
  type MockAccessProviderProps as ReactMockAccessProviderProps,
} from '@react-protected/react/testing'

/**
 * Props accepted by the React Router testing helper.
 */
export type MockAccessProviderProps<TUser = unknown> = ReactMockAccessProviderProps<TUser>

/**
 * Test helper that provides a predictable access context.
 */
export const MockAccessProvider: typeof ReactMockAccessProvider = ReactMockAccessProvider
