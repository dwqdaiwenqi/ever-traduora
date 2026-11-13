import React, { useEffect, useState } from 'react';
import { Form, Select, Button, Alert, Card, Upload, Result } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { head, countBy, entries, maxBy, last } from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';
import SelectLocale from '../shared/SelectLocale';
import { useProjectsStore } from '../../stores/projects.store';
import { useTranslationsStore } from '../../stores/translations.store';
import { importApi } from '../../api/export-import';
import { IMPORT_FORMATS } from '../../models';
import { errorToMessage } from '../../utils/api-error';
import type { Locale, ImportFormat, ImportResult } from '../../models';

const { Dragger } = Upload;

export default function ImportContainer() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, refreshProjectStats } = useProjectsStore();
  const { projectLocales, knownLocales, getProjectLocales, getKnownLocales } = useTranslationsStore();
  const [selectedLocale, setSelectedLocale] = useState<Locale>();
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>();
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [result, setResult] = useState<ImportResult>();

  useEffect(() => {
    if (currentProject) {
      getProjectLocales(currentProject.id);
      getKnownLocales();
    }
  }, [currentProject?.id]);

  const guessFormat = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext) {
      const fmt = IMPORT_FORMATS.find(v => v.extension === ext);
      if (fmt) setSelectedFormat(fmt);
    }
  };

  const handleImport = async () => {
    if (!currentProject || !selectedLocale || !selectedFormat || !file) return;
    setLoading(true);
    setErrorMessage(undefined);
    try {
      const res = await importApi.import(currentProject.id, selectedLocale, selectedFormat, file);
      setResult(res);
      await refreshProjectStats();
    } catch (error) {
      setErrorMessage(errorToMessage(error, 'ImportLocale'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(undefined);
    setFile(undefined);
    setSelectedFormat(undefined);
    setSelectedLocale(undefined);
    setErrorMessage(undefined);
  };

  if (result) {
    return (
      <div>
        <h3>导入结果</h3>
        <Result
          status="success"
          title="导入成功"
          subTitle={`添加了 ${result.terms.added} 个词条，跳过了 ${result.terms.skipped} 个，更新了 ${result.translations.upserted} 条翻译。`}
          extra={[
            <Button key="view" type="primary" onClick={() => navigate(`/projects/${projectId}/translations/${selectedLocale?.code}`)}>
              查看翻译
            </Button>,
            <Button key="again" onClick={reset}>再次导入</Button>,
          ]}
        />
      </div>
    );
  }

  const existingLocales = projectLocales.map(pl => pl.locale);

  return (
    <div>
      <h3>导入翻译</h3>
      <Card style={{ maxWidth: 560 }}>
        {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical">
          <Form.Item label="上传文件">
            <Dragger
              beforeUpload={f => { setFile(f); guessFormat(f); return false; }}
              fileList={file ? [{ uid: '-1', name: file.name, status: 'done' }] : []}
              onRemove={() => setFile(undefined)}
              maxCount={1}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p>点击或拖拽文件到此区域上传</p>
              <p style={{ color: '#888', fontSize: 12 }}>支持 JSON、YAML、CSV、XML 等格式</p>
            </Dragger>
          </Form.Item>
          <Form.Item label="目标语言" required>
            <SelectLocale locales={knownLocales} value={selectedLocale} onChange={setSelectedLocale} style={{ width: '100%' }} />
            {selectedLocale && existingLocales.some(l => l.code === selectedLocale.code) && (
              <Alert type="info" message="该语言已存在，导入将会更新现有翻译。" showIcon style={{ marginTop: 8 }} />
            )}
          </Form.Item>
          <Form.Item label="文件格式" required>
            <Select
              placeholder="选择格式..."
              value={selectedFormat?.code}
              onChange={code => setSelectedFormat(IMPORT_FORMATS.find(f => f.code === code))}
              options={IMPORT_FORMATS.map(f => ({ value: f.code, label: f.displayName }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Button
            type="primary"
            onClick={handleImport}
            disabled={!file || !selectedLocale || !selectedFormat}
            loading={loading}
          >
            开始导入
          </Button>
        </Form>
      </Card>
    </div>
  );
}
