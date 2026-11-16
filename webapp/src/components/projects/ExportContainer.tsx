import React, { useEffect, useState } from 'react';
import { Form, Select, Switch, Button, Alert, Card } from 'antd';
import { useProjectsStore } from '../../stores/projects.store';
import { useTranslationsStore } from '../../stores/translations.store';
import { exportApi } from '../../api/export-import';
import { EXPORT_FORMATS } from '../../models';
import { errorToMessage } from '../../utils/api-error';
import SelectLocale from '../shared/SelectLocale';
import type { Locale, ExportFormat } from '../../models';
import PageHeader from '../shared/PageHeader';

export default function ExportContainer() {
  const { currentProject } = useProjectsStore();
  const { projectLocales, getProjectLocales } = useTranslationsStore();
  const [selectedLocale, setSelectedLocale] = useState<Locale>();
  const [fallbackLocale, setFallbackLocale] = useState<Locale>();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>();
  const [untranslated, setUntranslated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const locales = projectLocales.map(pl => pl.locale);

  useEffect(() => {
    if (currentProject) getProjectLocales(currentProject.id);
  }, [currentProject?.id]);

  const handleExport = async () => {
    if (!currentProject || !selectedLocale || !selectedFormat) return;
    setLoading(true);
    setErrorMessage(undefined);
    try {
      await exportApi.exportAndDownload(currentProject.id, selectedLocale.code, selectedFormat, untranslated, fallbackLocale?.code);
    } catch (error) {
      setErrorMessage(errorToMessage(error, 'ExportLocale'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="导出" description="把某种语言的翻译导出成文件" />
      <Card style={{ maxWidth: 520 }}>
        {errorMessage && <Alert type="error" message={errorMessage} showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical">
          <Form.Item label="选择语言" required>
            <SelectLocale locales={locales} value={selectedLocale} onChange={setSelectedLocale} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="备用语言（可选）">
            <SelectLocale
              locales={locales.filter(l => l.code !== selectedLocale?.code)}
              value={fallbackLocale}
              onChange={setFallbackLocale}
              placeholder="无备用语言"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="导出格式" required>
            <Select
              placeholder="选择格式..."
              value={selectedFormat?.code}
              onChange={code => setSelectedFormat(EXPORT_FORMATS.find(f => f.code === code))}
              options={EXPORT_FORMATS.map(f => ({ value: f.code, label: f.displayName }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="包含未翻译词条">
            <Switch checked={untranslated} onChange={setUntranslated} />
          </Form.Item>
          <Button
            type="primary"
            onClick={handleExport}
            disabled={!selectedLocale || !selectedFormat}
            loading={loading}
          >
            下载
          </Button>
        </Form>
      </Card>
    </div>
  );
}
