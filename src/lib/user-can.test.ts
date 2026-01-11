import { describe, it, expect, beforeEach } from 'vitest';
import { UserCan, UserRoles, Resources, Actions } from './user-can';
import type { User } from '../db/auth';

describe('UserCan', () => {
    let shipperUser: User;
    let adminUser: User;

    beforeEach(() => {
        shipperUser = {
            id: 'shipper-1',
            name: 'Test Shipper',
            email: 'shipper@example.com',
            emailVerified: true,
            image: null,
            role: UserRoles.SHIPPER,
            isSystemUser: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            businessName: null,

            street: null,
            city: null,
            state: null,
            country: null,
            phoneCountryCode: null,
            phoneNumber: null,
            requestSlug: null,
            onboardedAt: null,
            verificationStatus: 'PENDING',
        };

        adminUser = {
            id: 'admin-1',
            name: 'Test Admin',
            email: 'admin@example.com',
            emailVerified: true,
            image: null,
            role: UserRoles.ADMIN,
            isSystemUser: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            businessName: null,

            street: null,
            city: null,
            state: null,
            country: null,
            phoneCountryCode: null,
            phoneNumber: null,
            requestSlug: null,
            onboardedAt: null,
            verificationStatus: 'PENDING',
        };
    });

    describe('with null user', () => {
        it('should deny all permissions', () => {
            const userCan = new UserCan(null);

            expect(userCan.canCreate(Resources.SHIPPER_CLIENTS)).toBe(false);
            expect(userCan.canRead(Resources.SHIPPER_CLIENTS)).toBe(false);
            expect(userCan.canUpdate(Resources.SHIPPER_CLIENTS)).toBe(false);
            expect(userCan.canDelete(Resources.SHIPPER_CLIENTS)).toBe(false);
            expect(userCan.canList(Resources.SHIPPER_CLIENTS)).toBe(false);
        });

        it('should return null for getUserId', () => {
            const userCan = new UserCan(null);
            expect(userCan.getUserId()).toBeNull();
        });

        it('should not be admin', () => {
            const userCan = new UserCan(null);
            expect(userCan.isAdmin()).toBe(false);
        });
    });

    describe('with admin user', () => {
        it('should allow all permissions', () => {
            const userCan = new UserCan(adminUser);

            expect(userCan.canCreate(Resources.SHIPPER_CLIENTS)).toBe(true);
            expect(userCan.canRead(Resources.SHIPPER_CLIENTS)).toBe(true);
            expect(userCan.canUpdate(Resources.SHIPPER_CLIENTS)).toBe(true);
            expect(userCan.canDelete(Resources.SHIPPER_CLIENTS)).toBe(true);
            expect(userCan.canList(Resources.SHIPPER_CLIENTS)).toBe(true);
        });

        it('should be admin', () => {
            const userCan = new UserCan(adminUser);
            expect(userCan.isAdmin()).toBe(true);
        });

        it('should allow access to all resources', () => {
            const userCan = new UserCan(adminUser);

            // Check all resources
            Object.values(Resources).forEach(resource => {
                expect(userCan.canCreate(resource)).toBe(true);
                expect(userCan.canRead(resource)).toBe(true);
            });
        });
    });

    describe('with shipper user', () => {
        it('should allow creating clients', () => {
            const userCan = new UserCan(shipperUser);
            expect(userCan.canCreate(Resources.SHIPPER_CLIENTS)).toBe(true);
        });

        it('should allow listing own clients', () => {
            const userCan = new UserCan(shipperUser);
            expect(userCan.canList(Resources.SHIPPER_CLIENTS)).toBe(true);
        });

        it('should allow reading own client', () => {
            const userCan = new UserCan(shipperUser);
            const ownClient = { ownerUserId: shipperUser.id };

            expect(userCan.canRead(Resources.SHIPPER_CLIENTS, ownClient)).toBe(true);
        });

        it('should deny reading another user client', () => {
            const userCan = new UserCan(shipperUser);
            const otherClient = { ownerUserId: 'other-user-id' };

            expect(userCan.canRead(Resources.SHIPPER_CLIENTS, otherClient)).toBe(false);
        });

        it('should allow updating own client', () => {
            const userCan = new UserCan(shipperUser);
            const ownClient = { ownerUserId: shipperUser.id };

            expect(userCan.canUpdate(Resources.SHIPPER_CLIENTS, ownClient)).toBe(true);
        });

        it('should deny updating another user client', () => {
            const userCan = new UserCan(shipperUser);
            const otherClient = { ownerUserId: 'other-user-id' };

            expect(userCan.canUpdate(Resources.SHIPPER_CLIENTS, otherClient)).toBe(false);
        });

        it('should allow deleting own client', () => {
            const userCan = new UserCan(shipperUser);
            const ownClient = { ownerUserId: shipperUser.id };

            expect(userCan.canDelete(Resources.SHIPPER_CLIENTS, ownClient)).toBe(true);
        });

        it('should deny deleting another user client', () => {
            const userCan = new UserCan(shipperUser);
            const otherClient = { ownerUserId: 'other-user-id' };

            expect(userCan.canDelete(Resources.SHIPPER_CLIENTS, otherClient)).toBe(false);
        });

        it('should return user ID', () => {
            const userCan = new UserCan(shipperUser);
            expect(userCan.getUserId()).toBe(shipperUser.id);
        });

        it('should not be admin', () => {
            const userCan = new UserCan(shipperUser);
            expect(userCan.isAdmin()).toBe(false);
        });

        it('should allow reading FX rates without ownership check', () => {
            const userCan = new UserCan(shipperUser);
            expect(userCan.canRead(Resources.FX_RATES)).toBe(true);
            expect(userCan.canList(Resources.FX_RATES)).toBe(true);
        });

        it('should allow creating FX rates', () => {
            const userCan = new UserCan(shipperUser);
            expect(userCan.canCreate(Resources.FX_RATES)).toBe(true);
        });
    });

    describe('can method', () => {
        it('should use generic can method for any action/resource', () => {
            const userCan = new UserCan(shipperUser);

            expect(userCan.can(Actions.CREATE, Resources.PICKUPS)).toBe(true);
            expect(userCan.can(Actions.LIST, Resources.BOXES)).toBe(true);
        });
    });
});
