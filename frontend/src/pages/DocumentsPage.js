import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { Search, Upload, FileText, CheckCircle, XCircle, Eye } from 'lucide-react';

const DocumentsPage = () => {
  const { api, hasRole, token } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadDocType, setUploadDocType] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (error) {
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, field, value) => {
    try {
      await api.put(`/documents/${bookingId}`, { [field]: value });
      toast.success('Document status updated');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to update document status');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/documents/${selectedDoc.booking_id}/upload/${uploadDocType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully');
      setUploadDialogOpen(false);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const openUploadDialog = (doc, docType) => {
    setSelectedDoc(doc);
    setUploadDocType(docType);
    setUploadDialogOpen(true);
  };

  const filteredDocuments = documents.filter(doc =>
    doc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isComplete = (doc) => {
    return doc.passport && doc.ktp && doc.photo && doc.vaccination;
  };

  const DocStatus = ({ checked, url, docType, doc }) => (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle size={18} className="text-emerald-500" />
      ) : (
        <XCircle size={18} className="text-slate-300" />
      )}
      {url ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => window.open(`${process.env.REACT_APP_BACKEND_URL}/api/files/${url}?auth=${token}`, '_blank')}
        >
          <Eye size={14} />
        </Button>
      ) : hasRole(['super_admin', 'operations', 'sales']) ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => openUploadDialog(doc, docType)}
        >
          <Upload size={14} />
        </Button>
      ) : null}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="documents-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900">{t('documents')}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {filteredDocuments.filter(d => isComplete(d)).length} / {filteredDocuments.length} complete
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder={`${t('search')} by customer name...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="documents-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>{t('customer')}</TableHead>
                <TableHead>{t('passport')}</TableHead>
                <TableHead>{t('ktp')}</TableHead>
                <TableHead>{t('photo')}</TableHead>
                <TableHead>{t('vaccination')}</TableHead>
                <TableHead>{t('mahramDoc')}</TableHead>
                <TableHead>{t('visaStatus')}</TableHead>
                <TableHead>{t('ticketStatus')}</TableHead>
                <TableHead>{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-slate-50/50" data-testid={`document-row-${doc.id}`}>
                  <TableCell className="font-medium">{doc.customer_name || 'N/A'}</TableCell>
                  <TableCell>
                    <DocStatus checked={doc.passport} url={doc.passport_url} docType="passport" doc={doc} />
                  </TableCell>
                  <TableCell>
                    <DocStatus checked={doc.ktp} url={doc.ktp_url} docType="ktp" doc={doc} />
                  </TableCell>
                  <TableCell>
                    <DocStatus checked={doc.photo} url={doc.photo_url} docType="photo" doc={doc} />
                  </TableCell>
                  <TableCell>
                    <DocStatus checked={doc.vaccination} url={doc.vaccination_url} docType="vaccination" doc={doc} />
                  </TableCell>
                  <TableCell>
                    <DocStatus checked={doc.mahram_doc} url={doc.mahram_doc_url} docType="mahram_doc" doc={doc} />
                  </TableCell>
                  <TableCell>
                    {hasRole(['super_admin', 'operations']) ? (
                      <Select 
                        value={doc.visa_status} 
                        onValueChange={(v) => handleUpdateStatus(doc.booking_id, 'visa_status', v)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Processing">Processing</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={doc.visa_status === 'Approved' ? 'badge-approved' : 'badge-pending'}>
                        {doc.visa_status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {hasRole(['super_admin', 'operations']) ? (
                      <Select 
                        value={doc.ticket_status} 
                        onValueChange={(v) => handleUpdateStatus(doc.booking_id, 'ticket_status', v)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Issued">Issued</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={doc.ticket_status === 'Issued' ? 'badge-approved' : 'badge-pending'}>
                        {doc.ticket_status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={isComplete(doc) ? 'badge-approved' : 'badge-pending'}>
                      {isComplete(doc) ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocuments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    No documents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Upload {uploadDocType?.replace('_', ' ').toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleUpload}
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-violet-500 transition-colors"
            >
              <FileText size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-sm text-slate-600">Click to upload {uploadDocType?.replace('_', ' ')}</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, or PDF</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsPage;
