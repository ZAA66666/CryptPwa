package com.zaa.cryptpwa;

import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.view.DragEvent;
import android.view.View;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

/**
 * MainActivity：Capacitor 桥。
 * 1) 小窗/分屏拖放接收：文字或图片拖入小窗时，OnDragListener 捕获 ClipData → JS。
 * 2) 系统分享接收：其他 App 分享文本/图片（ACTION_SEND）→ JS __sharedText。
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleSharedIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleSharedIntent(intent);
    }

    private void handleSharedIntent(Intent intent) {
        if (intent == null) return;
        String type = intent.getType();
        if (type == null) return;
        String payload = null;
        if (type.startsWith("text/")) {
            payload = intent.getStringExtra(Intent.EXTRA_TEXT);
        } else if (type.startsWith("image/") || type.startsWith("application/")) {
            Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (uri == null && intent.getClipData() != null && intent.getClipData().getItemCount() > 0) {
                uri = intent.getClipData().getItemAt(0).getUri();
            }
            if (uri != null) payload = uri.toString();
        }
        if (payload == null) return;
        final String data = payload;
        getBridge().getWebView().post(new Runnable() {
            @Override
            public void run() {
                getBridge().getWebView().evaluateJavascript(
                        "window.__sharedText && window.__sharedText(" + JSONObject.quote(data) + ");",
                        null
                );
            }
        });
    }

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
