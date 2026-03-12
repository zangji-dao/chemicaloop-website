import { redirect } from 'next/navigation';

/**
 * /admin/spu 重定向到 /admin/spu/list
 */
export default function SPUPage() {
  redirect('/admin/spu/list');
}
