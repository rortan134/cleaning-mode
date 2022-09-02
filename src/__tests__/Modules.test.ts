// import '@testing-library/jest-dom';

// import os from 'os';
// import { User32 } from 'win32-api';
// import {
//   getTaskbarState,
//   setTaskbarState,
//   lockTaskbarWithAutohide,
//   unlockTaskbarWithAutohide,
// } from '../main/main';

// describe('WinAPI', () => {
//   it('loads correctly', () => {
//     const user32 = User32.load();
//     expect(user32).toBeTruthy();
//   });
// });

// describe('Windows Taskbar', () => {
//   if (os.type() !== 'Windows_NT') return;

//   enum AppBarStates {
//     AutoHide = 0x01,
//     AlwaysOnTop = 0x02,
//   }

//   it('sets taskbar to always on top', () => {
//     expect(setTaskbarState(AppBarStates.AlwaysOnTop)).toBe(
//       AppBarStates.AlwaysOnTop
//     );
//   });

//   it('sets taskbar to auto-hide', () => {
//     expect(setTaskbarState(AppBarStates.AutoHide)).toBe(AppBarStates.AutoHide);
//   });

//   it('ignores lock auto-hide if is set to always on top', () => {
//     setTaskbarState(AppBarStates.AlwaysOnTop);
//     expect(lockTaskbarWithAutohide()).toBeFalsy();
//     expect(unlockTaskbarWithAutohide()).toBeFalsy();
//   });

//   it('locks and unlocks the taskbar', () => {
//     setTaskbarState(AppBarStates.AutoHide);
//     expect(lockTaskbarWithAutohide()).toBeTruthy();
//     expect(unlockTaskbarWithAutohide()).toBeTruthy();
//     expect(getTaskbarState()).toBe(AppBarStates.AutoHide);
//   });
// });
