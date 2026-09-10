#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <jpeglib.h>
#include <ft2build.h>
#include FT_FREETYPE_H
#define W 1920
#define H 1080
static unsigned char *im; static FT_Library ft; static FT_Face face;
static void blend(int x,int y,int r,int g,int b,int a){if(x<0||x>=W||y<0||y>=H)return; unsigned char*p=im+(y*W+x)*3; for(int i=0;i<3;i++){int c=i==0?r:i==1?g:b;p[i]=(p[i]*(255-a)+c*a)/255;}}
static void rr(int x,int y,int w,int h,int rad,int r,int g,int b,int a){for(int yy=y;yy<y+h;yy++)for(int xx=x;xx<x+w;xx++){int dx=xx<x+rad?x+rad-xx:xx>x+w-rad?xx-(x+w-rad):0;int dy=yy<y+rad?y+rad-yy:yy>y+h-rad?yy-(y+h-rad):0;if(dx*dx+dy*dy<=rad*rad)blend(xx,yy,r,g,b,a);}}
static int tw(const char*s,int size){FT_Set_Pixel_Sizes(face,0,size);int w=0;for(;*s;s++){if(FT_Load_Char(face,(unsigned char)*s,FT_LOAD_DEFAULT)==0)w+=face->glyph->advance.x>>6;}return w;}
static void txt(int x,int y,const char*s,int size,int r,int g,int b,int center){FT_Set_Pixel_Sizes(face,0,size);if(center)x-=tw(s,size)/2;for(;*s;s++){if(FT_Load_Char(face,(unsigned char)*s,FT_LOAD_RENDER))continue;FT_GlyphSlot q=face->glyph;for(int yy=0;yy<q->bitmap.rows;yy++)for(int xx=0;xx<q->bitmap.width;xx++)blend(x+q->bitmap_left+xx,y-q->bitmap_top+yy,r,g,b,q->bitmap.buffer[yy*q->bitmap.pitch+xx]);x+=q->advance.x>>6;}}
static void bubble(int x,int y,int w,const char*s,int user){rr(x,y,w,92,40,user?10:232,user?132:232,user?255:237,255);txt(x+34,y+60,s,30,user?255:21,user?255:21,user?255:21,0);}
static const char* line(double t){
 if(t<7)return "We built Claude for shopping.";if(t<13)return "Meet Okupy.";if(t<20)return "Shopping, through iMessage.";
 if(t<26)return "Too many stores.";if(t<32)return "Too much checking.";if(t<38)return "One conversation fixes that.";
 if(t<58)return "Okupy";if(t<75)return "Okupy keeps watching.";if(t<80)return "$1,299";if(t<86)return "$1,049";if(t<92)return "PRICE DROP";
 if(t<106)return "Okupy";if(t<116)return "Track this laptop on Jumia.";if(t<136)return "See Okupy in action.";
 if(t<142)return "It started as a hobby.";if(t<148)return "Then people started using it.";if(t<154)return "6 beta testers.";
 if(t<158)return "What testers want next";if(t<163)return "Can Okupy track food discounts too?";if(t<166)return "What should Okupy track next?";
 if(t<168)return "Phones.";if(t<170)return "Laptops.";if(t<172)return "Headphones.";if(t<174)return "And maybe much more.";if(t<175.2)return "One agent.";if(t<176.2)return "One conversation.";if(t<177.2)return "Okupy";if(t<178)return "Your shopping agent.";if(t<179)return "One message away.";return "TRACK. WAIT. SAVE.";}
static void frame(int idx,const char*out){double t=idx/2.0,phase=sin(t*.08);im=malloc(W*H*3);for(int y=0;y<H;y++)for(int x=0;x<W;x++){double u=x/(double)W,v=y/(double)H;double glow=exp(-((u-(.69+.03*phase))*(u-(.69+.03*phase))+(v-.43)*(v-.43))*5.5);unsigned char*p=im+(y*W+x)*3;p[0]=255;p[1]=108+75*u+42*glow;p[2]=5+110*u+95*glow;}
 int cardx=130+(int)(10*sin(t*.45)),cardy=105,cardw=1660,cardh=870;rr(cardx+8,cardy+18,cardw,cardh,46,95,48,15,25);rr(cardx,cardy,cardw,cardh,46,248,244,240,255);
 const char*s=line(t);if(t>=75&&t<92)s="";int size=strlen(s)>34?62:strlen(s)>22?74:94;txt(W/2,310,s,size,21,21,21,1);
 if(t>=38&&t<58){txt(W/2,205,"Okupy",48,21,21,21,1);bubble(930,370,690,"Track this phone for me.",1);bubble(760,482,860,"Let me know when it drops below $1,100.",1);bubble(300,630,570,"Done. I'll keep watching.",0);}
 if(t>=75&&t<92){rr(320,450,1280,360,36,252,249,246,255);txt(W/2,650,t<80?"$1,299":"$1,049",150,t<86?21:255,t<86?21:121,t<86?21:0,1);if(t>=86)txt(W/2,755,"PRICE DROP",42,255,121,0,1);}
 if(t>=92&&t<106){bubble(300,410,450,"Price drop!",0);bubble(300,520,1080,"A seller on Amazon now has it for $1,049.",0);bubble(300,630,430,"That's $250 less.",0);bubble(300,740,380,"Want the link?",0);bubble(1250,850,330,"Send it.",1);}
 if(t>=116&&t<136){bubble(750,430,850,"Track this laptop on Jumia.",1);bubble(300,545,340,"Tracking.",0);bubble(880,660,700,"Notify me when it's 15% off.",1);bubble(300,775,260,"Got it.",0);}
 if(t>=136&&t<154&&t>=148){txt(W/2,690,"6",280,255,121,0,1);}
 if(t>=154&&t<166){bubble(345,520,1230,t<163?"Can Okupy track food discounts too?":"What should Okupy track next?",0);}
 if(t>=177){bubble(565,550,790,"Okupy, track this for me.",1);rr(830,690,260,80,40,232,232,237,255);for(int i=0;i<3;i++){int a=(int)(120+100*sin(t*7+i));rr(890+i*55,716,26,26,13,104,104,104,a);}txt(W/2,910,"Powered by Photon",28,104,104,104,1);}
 FILE*f=fopen(out,"wb");struct jpeg_compress_struct c;struct jpeg_error_mgr e;c.err=jpeg_std_error(&e);jpeg_create_compress(&c);jpeg_stdio_dest(&c,f);c.image_width=W;c.image_height=H;c.input_components=3;c.in_color_space=JCS_RGB;jpeg_set_defaults(&c);jpeg_set_quality(&c,48,1);jpeg_start_compress(&c,1);while(c.next_scanline<c.image_height){JSAMPROW row=im+c.next_scanline*W*3;jpeg_write_scanlines(&c,&row,1);}jpeg_finish_compress(&c);jpeg_destroy_compress(&c);fclose(f);free(im);}
int main(int ac,char**av){if(ac<3)return 2;FT_Init_FreeType(&ft);FT_New_Face(ft,"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",0,&face);int i=atoi(av[1]);frame(i,av[2]);FT_Done_Face(face);FT_Done_FreeType(ft);}
