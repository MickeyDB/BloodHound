// Copyright 2026 Specter Ops, Inc.
//
// Licensed under the Apache License, Version 2.0
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

import { ActiveDirectoryKindProperties, ActiveDirectoryNodeKind, CommonKindProperties } from '../../graphSchema';
import { isPotentialDecoyUser } from './PotentialDecoyBanner';

const basePotentialDecoyProperties = {
    [ActiveDirectoryKindProperties.LastLogon]: 0,
    [ActiveDirectoryKindProperties.LastLogonTimestamp]: -1,
    [CommonKindProperties.Enabled]: true,
    [CommonKindProperties.Name]: 'svc-watch@TESTLAB.LOCAL',
    [CommonKindProperties.ObjectID]: 'S-1-5-21-570004220-2248230615-4072641716-5965',
    [CommonKindProperties.WhenCreated]: '2026-03-01T00:00:00Z',
};

describe('isPotentialDecoyUser', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-18T00:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns true for old enabled users with no recorded logon', () => {
        expect(isPotentialDecoyUser(ActiveDirectoryNodeKind.User, basePotentialDecoyProperties)).toBe(true);
    });

    it('returns false for non-user nodes', () => {
        expect(isPotentialDecoyUser(ActiveDirectoryNodeKind.Computer, basePotentialDecoyProperties)).toBe(false);
    });

    it('returns false for recently created users', () => {
        expect(
            isPotentialDecoyUser(ActiveDirectoryNodeKind.User, {
                ...basePotentialDecoyProperties,
                [CommonKindProperties.WhenCreated]: '2026-06-01T00:00:00Z',
            })
        ).toBe(false);
    });

    it('returns false for disabled users', () => {
        expect(
            isPotentialDecoyUser(ActiveDirectoryNodeKind.User, {
                ...basePotentialDecoyProperties,
                [CommonKindProperties.Enabled]: false,
            })
        ).toBe(false);
    });

    it('returns false for special accounts', () => {
        expect(
            isPotentialDecoyUser(ActiveDirectoryNodeKind.User, {
                ...basePotentialDecoyProperties,
                [CommonKindProperties.ObjectID]: 'S-1-5-21-570004220-2248230615-4072641716-500',
            })
        ).toBe(false);

        expect(
            isPotentialDecoyUser(ActiveDirectoryNodeKind.User, {
                ...basePotentialDecoyProperties,
                [CommonKindProperties.Name]: 'AZUREADSSOACC.TESTLAB.LOCAL',
            })
        ).toBe(false);
    });

    it('returns false for managed service accounts', () => {
        expect(
            isPotentialDecoyUser(ActiveDirectoryNodeKind.User, {
                ...basePotentialDecoyProperties,
                [ActiveDirectoryKindProperties.GMSA]: true,
            })
        ).toBe(false);

        expect(
            isPotentialDecoyUser(ActiveDirectoryNodeKind.User, {
                ...basePotentialDecoyProperties,
                [ActiveDirectoryKindProperties.MSA]: true,
            })
        ).toBe(false);
    });
});
