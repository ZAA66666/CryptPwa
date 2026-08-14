package com.zaa.cryptpwa;

import android.content.ClipData;
import android.view.DragEvent;
import android.view.View;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

/**
 * MainActivity：Capacitor 桥。
 * 小窗/分屏拖放接收：其他应用把文字或图片拖入本应用挂起小窗时，
 * 通过 OnDragListener 捕获 ClipData，转成文本/URI 用 JS Bridge 推给网页层。
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onStart() {
        super.onStart();
        final WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) return;
        webView.setOnDragListener(new View.OnDragListener() {
            @Override
            public boolean onDrag(View v, DragEvent event) {
                switch (event.getAction()) {
                    case DragEvent.ACTION_DRAG_STARTED:
                        // 只接收文本或 URI（图片）拖放
                        return event.getClipDescription() != null
                                && (event.getClipDescription().hasMimeType("text/*")
                                || event.getClipDescription().hasMimeType("image/*"));
                    case DragEvent.ACTION_DRAG_ENTERED:
                    case DragEvent.ACTION_DRAG_LOCATION:
                        return true;
                    case DragEvent.ACTION_DROP: {
                        ClipData data = event.getClipData();
                        if (data == null) return false;
                        StringBuilder buf = new StringBuilder();
                        for (int i = 0; i < data.getItemCount(); i++) {
                            ClipData.Item item = data.getItemAt(i);
                            if (item.getText() != null) {
                                if (buf.length() > 0) buf.append("\n");
                                buf.append(item.getText());
                            } else if (item.getUri() != null) {
                                if (buf.length() > 0) buf.append("\n");
                                // 图片/文件：传 content:// URI，网页层可尝试读取
                                buf.append(item.getUri().toString());
                            }
                        }
                        if (buf.length() > 0) {
                            final String payload = buf.toString();
                            webView.post(new Runnable() {
                                @Override
                                public void run() {
                                    webView.evaluateJavascript(
                                            "window.__dragDrop && window.__dragDrop(" + JSONObject.quote(payload) + ");",
                                            null
                                    );
                                }
                            });
                        }
                        return true;
                    }
                    case DragEvent.ACTION_DRAG_ENDED:
                        return true;
                    default:
                        return true;
                }
            }
        });
    }
}
