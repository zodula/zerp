import { useZui } from "@/zodula/ui";

function calcVolume(frm: any) {
    const num = (v: any) => parseFloat(String(v ?? 0)) || 0;
    const length = num(frm.get_value("length"));
    const width = num(frm.get_value("width"));
    const height = num(frm.get_value("height"));
    const volume = length * width * height;
    frm.set_value("volume", volume);
}

export default function ProductScripts() {
    useZui((zui) => {
        zui.form.on("Product", {
            on_render(frm) {
                calcVolume(frm);
            },
            length(frm) {
                calcVolume(frm);
            },
            width(frm) {
                calcVolume(frm);
            },
            height(frm) {
                calcVolume(frm);
            },
        });
    }, []);
    return <></>;
}

