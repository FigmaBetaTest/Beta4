import { createBrowserRouter } from 'react-router';
import { RepositoryLayoutShell } from './components/repository-layout-shell';
import { RepositoryPage } from './components/repository-page';
import { ContractCanvas } from './components/contract-canvas';
import { ComponentEditor } from './components/component-editor';
import { FoundationEditor } from './components/foundation-editor';
import { ApprovalsPage } from './components/approvals-page';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RepositoryLayoutShell,
    children: [
      { index: true, Component: RepositoryPage },
      { path: 'canvas/:id', Component: ContractCanvas },
      { path: 'editor/:id', Component: ComponentEditor },
      { path: 'foundation-editor/:id', Component: FoundationEditor },
      { path: 'approvals', Component: ApprovalsPage },
    ],
  },
]);
