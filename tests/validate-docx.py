"""Check native DOCX relationships and embedded images. Usage: python tests/validate-docx.py report.docx"""
import sys
import posixpath
from io import BytesIO
from zipfile import ZipFile
from lxml import etree
from PIL import Image
from docx import Document
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
P = 'http://schemas.openxmlformats.org/package/2006/relationships'
for path in sys.argv[1:]:
    with ZipFile(path) as z:
        assert z.testzip() is None, 'ZIP checksum failure'
        names=set(z.namelist())
        for name in names:
            if name.endswith(('.xml','.rels')):
                root=etree.fromstring(z.read(name))
                if name.endswith('.rels'):
                    prefix='' if name=='_rels/.rels' else name.split('/_rels/')[0]+'/'
                    for rel in root:
                        assert rel.get('TargetMode')!='External', 'Unexpected external relationship'
                        target=posixpath.normpath(posixpath.join(prefix,rel.get('Target',''))).lstrip('/')
                        assert target in names, (name,target)
        root=etree.fromstring(z.read('word/document.xml'))
        assert root.nsmap.get('r')==R, 'Wrong relationship namespace'
        assert not root.xpath('//*[namespace-uri()=$bad]',bad=R+'/'), 'Malformed relationship namespace'
        for table in root.findall('.//{%s}tbl'%W):
            assert table.find('{%s}tblGrid'%W) is not None, 'Missing table grid'
        rels=etree.fromstring(z.read('word/_rels/document.xml.rels'))
        byid={rel.get('Id'):rel for rel in rels}
        referenced=root.xpath('//@r:embed | //@r:id',namespaces={'r':R})
        assert all(rid in byid for rid in referenced), 'Unresolved reference'
        image_count=0
        for rel in rels:
            if rel.get('Type')==R+'/image':
                data=z.read(posixpath.normpath('word/'+rel.get('Target')))
                Image.open(BytesIO(data)).verify();image_count+=1
        assert image_count>0, 'No embedded images'
    doc=Document(path)
    assert len(doc.inline_shapes)>0
    # Resolve every image with the standard Word relationship namespace.
    for shape in doc.inline_shapes:
        rid=shape._inline.graphic.graphicData.pic.blipFill.blip.embed
        assert rid in doc.part.related_parts
    print(f'PASS {path}: native OOXML, valid relationships, table grids, {image_count} embedded images, no external links')
