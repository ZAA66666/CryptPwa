package com.zaa.cryptpwa;

import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;

/**
 * FolderPicker：调起系统「选择文件夹」对话框（ACTION_OPEN_DOCUMENT_TREE），
 * 返回目录 URI + 目录名给 JS（供「内容保存路径」使用）。
 */
@CapacitorPlugin(name = "FolderPicker")
public class FolderPickerPlugin extends Plugin {

    private static final String PICK = "pickFolder";

    @PluginMethod
    public void pickFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
                | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        startActivityForResult(call, intent, PICK);
    }

    @ActivityCallback
    private void pickResult(PluginCall call, com.getcapacitor.annotation.ActivityResult result) {
        if (result.getResultCode() == android.app.Activity.RESULT_OK && result.getData() != null) {
            Uri uri = result.getData().getData();
            if (uri == null) { call.reject("no uri"); return; }
            /* 持久化授权，之后可直接读写该目录 */
            try {
                getActivity().getContentResolver().takePersistableUriPermission(
                        uri, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            } catch (Exception ignored) {}
            String name = uri.getLastPathSegment();
            if (name == null) name = "selected";
            if (name.contains(":")) name = name.substring(name.indexOf(":") + 1);
            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            ret.put("name", name);
            call.resolve(ret);
        } else {
            call.reject("cancelled");
        }
    }

    /** 把内容写入「已选目录」（tree URI 下新建/覆盖指定文件） */
    @PluginMethod
    public void saveFile(PluginCall call) {
        String uriStr = call.getString("uri");
        String fileName = call.getString("name");
        String base64 = call.getString("data");
        if (uriStr == null || fileName == null || base64 == null) { call.reject("missing args"); return; }
        try {
            Uri treeUri = Uri.parse(uriStr);
            android.content.ContentResolver cr = getActivity().getContentResolver();
            Uri docUri = android.provider.DocumentsContract.buildDocumentUriUsingTree(treeUri, fileName);
            java.io.OutputStream os = cr.openOutputStream(docUri, "w");
            if (os == null) { call.reject("cannot open output"); return; }
            os.write(android.util.Base64.decode(base64, android.util.Base64.DEFAULT));
            os.flush();
            os.close();
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
