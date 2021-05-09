const canvas = document.querySelector('canvas')
const ctx = canvas.getContext("2d")

var FT_DIRECT = -1
var FT_INVERSE = 1

let waterfall = new ImageData(500, 200);

function NUMBER_IS_2_POW_K(x) {
    return ((!((x) & ((x) - 1))) && ((x) > 1))
}

function FFT(Rdat, Idat, N, LogN, Ft_Flag) {
    // parameters error check:
    /* if ((Rdat == null) || (Idat == null)) return false;
    if ((N > 16384) || (N < 1)) return false;
    if (!NUMBER_IS_2_POW_K(N)) return false;
    if ((LogN < 2) || (LogN > 14)) return false;
    if ((Ft_Flag != FT_DIRECT) && (Ft_Flag != FT_INVERSE)) return false; */

    let i, j, n, k, io, ie, in1, nn;
    let ru, iu, rtp, itp, rtq, itq, rw, iw, sr;

    const Rcoef =
        [
            -1.0000000000000000, 0.0000000000000000, 0.7071067811865475,
            0.9238795325112867, 0.9807852804032304, 0.9951847266721969,
            0.9987954562051724, 0.9996988186962042, 0.9999247018391445,
            0.9999811752826011, 0.9999952938095761, 0.9999988234517018,
            0.9999997058628822, 0.9999999264657178
        ];
    const Icoef =
        [
            0.0000000000000000, -1.0000000000000000, -0.7071067811865474,
            -0.3826834323650897, -0.1950903220161282, -0.0980171403295606,
            -0.0490676743274180, -0.0245412285229122, -0.0122715382857199,
            -0.0061358846491544, -0.0030679567629659, -0.0015339801862847,
            -0.0007669903187427, -0.0003834951875714
        ];

    nn = N >> 1;
    ie = N;
    for (n = 1; n <= LogN; n++) {
        rw = Rcoef[LogN - n];
        iw = Icoef[LogN - n];
        if (Ft_Flag == FT_INVERSE) iw = -iw;
        in1 = ie >> 1;
        ru = 1.0;
        iu = 0.0;
        for (j = 0; j < in1; j++) {
            for (i = j; i < N; i += ie) {
                io = i + in1;
                rtp = Rdat[i] + Rdat[io];
                itp = Idat[i] + Idat[io];
                rtq = Rdat[i] - Rdat[io];
                itq = Idat[i] - Idat[io];
                Rdat[io] = rtq * ru - itq * iu;
                Idat[io] = itq * ru + rtq * iu;
                Rdat[i] = rtp;
                Idat[i] = itp;
            }

            sr = ru;
            ru = ru * rw - iu * iw;
            iu = iu * rw + sr * iw;
        }

        ie >>= 1;
    }

    for (j = i = 1; i < N; i++) {
        if (i < j) {
            io = i - 1;
            in1 = j - 1;
            rtp = Rdat[in1];
            itp = Idat[in1];
            Rdat[in1] = Rdat[io];
            Idat[in1] = Idat[io];
            Rdat[io] = rtp;
            Idat[io] = itp;
        }

        k = nn;

        while (k < j) {
            j = j - k;
            k >>= 1;
        }

        j = j + k;
    }

    if (Ft_Flag == FT_DIRECT) return true;

    rw = 1.0 / N;

    for (i = 0; i < N; i++) {
        Rdat[i] *= rw;
        Idat[i] *= rw;
    }

    return true;
}

const input = document.querySelector('input')
input.addEventListener('input', change)
function change(e) {
    if (input.value > 14) {
        input.value = 14
    }
    if (input.value < 2) {
        input.value = 2
    }
    N = 2 ** input.value
    //waterfall = new ImageData(N, waterfall.height);
    //y = 0
    //main()

}
let N = 32

input.value = Math.log2(N)

function plotInvert(Re, Im, ofY) {
    FFT(Re, Im, N, Math.log2(N), FT_INVERSE);
    ctx.beginPath();
    ctx.moveTo(0, ofY);
    ctx.lineTo(500, ofY);
    ctx.stroke();
    ctx.beginPath();
    for (i = 0; i < N; i++) {
        let [px, py] = [(500 / N) * i, ofY - (Re[i]) * 16]
        ctx.lineTo(px, py);
        ctx.moveTo(px, py);
    }
    ctx.stroke();
}

function plotDirect(Re, Im, ofY) {
    FFT(Re, Im, N, Math.log2(N), FT_DIRECT); // вычисляем прямое БПФ
    const max = Math.max(...Re.map((e, i) => (Re[i] * Re[i] + Im[i] * Im[i])))

    ctx.beginPath();
    for (i = N / 2; i < N; i++) {
        let ic = (i - N / 2) * 1.8
        //ctx.moveTo((500/N)*i, ofX);
        ctx.lineTo((500 / N) * ic, ofY - ((Re[i] * Re[i] + Im[i] * Im[i]) / max) * 100);

        if ((Re[i] * Re[i] + Im[i] * Im[i]) > N) {
            ctx.fillText(Math.ceil(ic), (500 / N) * ic, ofY + 15)
        }
    }
    ctx.lineTo((500 / N) * N / 2 * 1.8, ofY);
    ctx.stroke();

}
const ONE_SIXTH = 1 / 6;
const ONE_THIRD = 1 / 3;
const TWO_THIRDS = 2 / 3;

const hue2rgb = (p, q, t) => {
    if (t < 0) {
        t += 1;
    }
    if (t > 1) {
        t -= 1;
    }
    if (t < ONE_SIXTH) {
        return p + (q - p) * 6 * t;
    }
    if (t < 0.5) {
        return q;
    }
    if (t < TWO_THIRDS) {
        return p + (q - p) * (TWO_THIRDS - t) * 6;
    }
    return p;
};

const hsl2rgb = (h, s, l) => {
    if (s === 0) {
        return new Array(3).fill(l);
    }
    const q =
        l < 0.5 ?
            l * s + l :
            l + s - l * s;
    const p = 2 * l - q;
    return [
        hue2rgb(p, q, h + ONE_THIRD),
        hue2rgb(p, q, h),
        hue2rgb(p, q, h - ONE_THIRD),
    ];
}

function map(x, in_min, in_max, out_min, out_max)
{
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


let y = waterfall.height
function main() {
    let start = performance.now();
    ctx.clearRect(0, 0, 1000, 400)
    let ofX = 100
    ctx.beginPath();
    ctx.moveTo(0, ofX);
    ctx.lineTo(500, ofX);
    ctx.stroke();
    let Re = [];
    let Im = [];
    let p = 2 * Math.PI / N; // будет 8 отсчетов на период

    let i;
    // формируем сигнал
    for (i = 0; i < N; i++) {
        Re[i] = Math.cos(i*p)+Math.sin(i)+Math.sin(i/2)  // заполняем действительную часть сигнала
        Im[i] = 0.0;         // заполняем мнимую часть сигнала
    }

    ctx.textAlign = "center"


    plotDirect(Re, Im, ofX)
    ofX += 100

    const max = Math.max(...Re.map((e, i) => (Re[i] * Re[i] + Im[i] * Im[i])))
    let ii = 0
    for (let i = y * 4 * waterfall.width; i < ((waterfall.width * 1) * 4) + y * 4 * waterfall.width; i += 4) {
        /* let color = ((Re[ii] * Re[ii] + Im[ii] * Im[ii]) / max) * 230 */
        let c = hsl2rgb(map(1-(Re[ii] * Re[ii] + Im[ii] * Im[ii]) / max,0,1,0,0.666666666666), 1, 0.5)

        waterfall.data[i] = c[0] * 255
        waterfall.data[i + 1] = c[1] * 255
        waterfall.data[i + 2] = c[2] * 255
        waterfall.data[i + 3] = 255
        ii++
    }
    ctx.putImageData(waterfall, 0, ofX - y, 0, y, waterfall.width, waterfall.height - y)    
    ctx.putImageData(waterfall,0,ofX+waterfall.height - y,0,0, waterfall.width,waterfall.height - (waterfall.height - y))


    ofX -= 50
    plotInvert(Re, Im, ofX)


    var duration = performance.now() - start;
    ctx.fillText(N, 250, 50)
    ctx.fillText(duration, 250, 60)
    y--
    if (y < 0) {
        y = waterfall.height
    }
    /* y++
    if (y > waterfall.height) {
        y = 0
    }  */

    requestAnimationFrame(main)
}

requestAnimationFrame(main)