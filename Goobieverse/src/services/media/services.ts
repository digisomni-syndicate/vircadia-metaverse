import StaticResource from './static-resource/static-resource.service';
import UploadPresigned from './upload-presigned/upload-presigned.service';
import UploadMedia from './upload-media/upload-media.service';
import Upload from './upload-media/upload-asset.service';
import FileBrowser from './file-browser/file-browser.service';
import Avatar from './avatar/avatar.service';
export default [FileBrowser, StaticResource, UploadPresigned, UploadMedia, Upload, Avatar];