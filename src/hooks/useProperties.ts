// Custom hooks for property operations with React Query caching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  getPropertiesByUser,
  getPropertyById,
  addProperty,
  updateProperty,
  deleteProperty,
  type PropertyInput
} from '../services/PropertyService';

// Query Keys
export const propertyKeys = {
  all: ['properties'] as const,
  user: (userId: string) => [...propertyKeys.all, 'user', userId] as const,
  property: (propertyId: string) => [...propertyKeys.all, 'property', propertyId] as const,
};

// Hook for getting user's properties
export function useUserProperties() {
  const { currentUser } = useAuth();
  
  return useQuery({
    queryKey: propertyKeys.user(currentUser?.uid || ''),
    queryFn: () => getPropertiesByUser(currentUser!.uid),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // Properties don't change often
  });
}

// Hook for getting a specific property
export function useProperty(propertyId: string) {
  const { currentUser } = useAuth();
  
  return useQuery({
    queryKey: propertyKeys.property(propertyId),
    queryFn: () => getPropertyById(propertyId),
    enabled: !!currentUser && !!propertyId,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutation hooks
export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: (propertyData: PropertyInput) => addProperty(propertyData),
    onSuccess: () => {
      // Invalidate user properties to trigger refetch
      queryClient.invalidateQueries({ queryKey: propertyKeys.user(currentUser!.uid) });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: ({ propertyId, propertyData }: { propertyId: string; propertyData: Partial<PropertyInput> }) =>
      updateProperty(propertyId, propertyData, currentUser!.uid),
    onSuccess: (_, { propertyId }) => {
      // Invalidate the specific property and user properties
      queryClient.invalidateQueries({ queryKey: propertyKeys.property(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.user(currentUser!.uid) });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: (propertyId: string) => deleteProperty(propertyId, currentUser!.uid),
    onSuccess: (_, propertyId) => {
      // Remove from cache and invalidate user properties
      queryClient.removeQueries({ queryKey: propertyKeys.property(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.user(currentUser!.uid) });
    },
  });
}
