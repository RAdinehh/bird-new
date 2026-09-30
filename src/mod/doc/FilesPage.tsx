import { useState, useEffect, useMemo } from 'react';
import {
  listFiles, deleteFile, downloadFile, openFile, totalSize,
  CATEGORY_LABEL, CATEGORY_ICON, LINKED_TYPE_LABEL, formatSize,
  type DocFile, type DocCategory
} from './store';
import UploadModal from './UploadModal';
import { Btn, BtnRow, Empty, Modal, PageContainer } from '../../shr/components/ui';
import { StatBox, Dot } from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';
import { ListCard, fabStyle, GridCard, chip } from './helpers';

type ViewMode = 'grid' | 'list';

export default function FilesPage() {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBytes, setTotalBytes] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterCat, setFilterCat] = useState<DocCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const all = await listFiles();
        const size = await totalSize();
        if (mounted) {
          setFiles(all);
          setTotalBytes(size);
        }
      } catch { /* ignore */ }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [refresh]);

  const filtered = useMemo(() => {
    let arr = files;
    if (filterCat !== 'all') arr = arr.filter(f => f.category === filterCat);
    if (search.trim() !== '') {
      const q = search.trim();
      arr = arr.filter(f =>
        f.name.includes(q) ||
        f.notes.includes(q) ||
        f.tags.some(t => t.includes(q))
      );
    }
    return arr;
  }, [files, filterCat, search]);

  const counts: Record<string, number> = { all: files.length };
  files.forEach(f => { counts[f.category] = (counts[f.category] || 0) + 1; });

  const previewFile = previewId ? files.find(f => f.id === previewId) : null;
  const delFile = delId ? files.find(f => f.id === delId) : null;

  const handleDelete = async () => {
    if (delId === null) return;
    await deleteFile(delId);
    setDelId(null);
    setRefresh(r => r + 1);
  };

  return (
    <PageContainer>
      {/* آمار */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 'var(--pad-comfy)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10
        }}>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>
            📁 اسناد
          </div>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{
              width: 36, height: 36,
              borderRadius: 10,
              background: 'var(--btn-bg)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {viewMode === 'grid' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            )}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <StatBox icon="📁" label="فایل‌ها" value={toFa(files.length)} tone="accent" />
          <Dot />
          <StatBox icon="💾" label="حجم" value={formatSize(totalBytes)} />
          <Dot />
          <StatBox icon="📂" label="دسته‌ها" value={toFa(Object.keys(counts).length - 1)} />
        </div>
      </div>

      {/* جستجو */}
      <div style={{
        height: 38,
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="جستجو در نام، برچسب، یادداشت..."
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-base)',
            minWidth: 0
          }}
        />
      </div>

      {/* فیلتر */}
      {files.length > 0 ? (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          <button type="button" onClick={() => setFilterCat('all')} style={chip(filterCat === 'all')}>
            همه ({toFa(counts.all || 0)})
          </button>
          {(Object.keys(CATEGORY_LABEL) as DocCategory[]).map(c => {
            const n = counts[c] || 0;
            if (n === 0) return null;
            return (
              <button key={c} type="button" onClick={() => setFilterCat(c)} style={chip(filterCat === c)}>
                {CATEGORY_ICON[c]} {CATEGORY_LABEL[c]} ({toFa(n)})
              </button>
            );
          })}
        </div>
      ) : null}

      {/* محتوا */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
          در حال بارگذاری...
        </div>
      ) : files.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>}
          title="هنوز فایلی اضافه نکرده‌اید"
          desc="می‌توانید تصویر، PDF، فاکتور، رسید، صدا یا هر سند دیگری را اضافه کنید."
          action={<Btn variant="primary" onClick={() => setUploadOpen(true)}>+ افزودن فایل</Btn>}
        />
      ) : filtered.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>}
          title="نتیجه‌ای یافت نشد"
          desc="عبارت دیگری امتحان کنید یا فیلتر را بردارید."
        />
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8
        }}>
          {filtered.map(f => <GridCard key={f.id} file={f} onPreview={() => setPreviewId(f.id)} onDelete={() => setDelId(f.id)} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(f => <ListCard key={f.id} file={f} onPreview={() => setPreviewId(f.id)} onDelete={() => setDelId(f.id)} />)}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setUploadOpen(true)}
        style={fabStyle}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* مودال آپلود */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => setRefresh(r => r + 1)}
      />

      {/* پیش‌نمایش */}
      <Modal
        open={previewId !== null}
        onClose={() => setPreviewId(null)}
        title={previewFile ? previewFile.name : 'پیش‌نمایش'}
        footer={
          previewFile ? (
            <BtnRow>
              <Btn variant="primary" onClick={() => openFile(previewFile)}>باز کردن</Btn>
              <Btn onClick={() => downloadFile(previewFile)}>دانلود</Btn>
              <Btn onClick={() => setPreviewId(null)}>بستن</Btn>
            </BtnRow>
          ) : null
        }
      >
        {previewFile ? (
          <>
            {previewFile.category === 'image' ? (
              <img
                src={URL.createObjectURL(previewFile.blob)}
                alt={previewFile.name}
                style={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'contain',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--input-bg)'
                }}
              />
            ) : previewFile.category === 'audio' ? (
              <audio
                controls
                src={URL.createObjectURL(previewFile.blob)}
                style={{ width: '100%' }}
              />
            ) : previewFile.category === 'video' ? (
              <video
                controls
                src={URL.createObjectURL(previewFile.blob)}
                style={{ width: '100%', borderRadius: 'var(--r-md)' }}
              />
            ) : (
              <div style={{
                padding: 40,
                textAlign: 'center',
                fontSize: 60
              }}>
                {CATEGORY_ICON[previewFile.category]}
              </div>
            )}

            <div style={{
              background: 'var(--input-bg)',
              borderRadius: 'var(--r-md)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 'var(--fs-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>نام:</span>
                <span style={{ fontWeight: 600, maxWidth: '60%', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {previewFile.name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>حجم:</span>
                <span style={{ fontWeight: 600 }}>{formatSize(previewFile.size)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>دسته:</span>
                <span style={{ fontWeight: 600 }}>{CATEGORY_LABEL[previewFile.category]}</span>
              </div>
              {previewFile.linkedType !== 'none' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>اتصال:</span>
                  <span style={{ fontWeight: 600 }}>{LINKED_TYPE_LABEL[previewFile.linkedType] || previewFile.linkedType}</span>
                </div>
              ) : null}
              {previewFile.tags.length > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--muted)' }}>برچسب‌ها:</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '70%' }}>
                    {previewFile.tags.map((t, i) => (
                      <span key={i} style={{
                        padding: '2px 8px',
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        borderRadius: 6,
                        fontSize: 'var(--fs-xs)',
                        fontWeight: 600
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {previewFile.notes ? (
                <div style={{ marginTop: 4, paddingTop: 6, borderTop: '1px dashed var(--border)' }}>
                  <div style={{ color: 'var(--muted)', marginBottom: 2 }}>یادداشت:</div>
                  <div style={{ lineHeight: 1.7 }}>{previewFile.notes}</div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </Modal>

      {/* تأیید حذف */}
      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف فایل"
        footer={<BtnRow><Btn variant="danger" onClick={handleDelete}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          حذف <b>{delFile?.name}</b>؟
          <br />
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>این عمل قابل بازگشت نیست.</span>
        </div>
      </Modal>
    </PageContainer>
  );
}

/** کارت گالری */
/** کارت لیستی */